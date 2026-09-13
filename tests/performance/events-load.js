import encoding from 'k6/encoding';
import http from 'k6/http';
import { check, sleep } from 'k6';

const apiBaseUrl = (__ENV.K6_API_BASE_URL || 'http://backend:5062/api')
  .replace(/\/$/, '');
const virtualUsers = positiveInteger(__ENV.EDUMEET_LOAD_VUS, 10);
const loadDuration = __ENV.EDUMEET_LOAD_DURATION || '60s';
const warmupDuration = __ENV.EDUMEET_WARMUP_DURATION || '10s';

// A valid 1x1 PNG keeps multipart setup realistic without requiring a fixture file.
const pngBytes = encoding.b64decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n9sAAAAASUVORK5CYII=',
  'std',
);

export const options = {
  scenarios: {
    warmup: {
      executor: 'ramping-vus',
      exec: 'browseEvents',
      startVUs: 0,
      stages: [{ duration: warmupDuration, target: Math.min(virtualUsers, 3) }],
      gracefulRampDown: '0s',
      tags: { phase: 'warmup' },
    },
    measured_load: {
      executor: 'constant-vus',
      exec: 'browseEvents',
      vus: virtualUsers,
      duration: loadDuration,
      startTime: warmupDuration,
      gracefulStop: '5s',
      tags: { phase: 'load' },
    },
  },
  thresholds: {
    'http_req_failed{phase:load}': ['rate<0.01'],
    'http_req_duration{phase:load}': ['p(95)<750'],
    'checks{phase:load}': ['rate>0.99'],
  },
};

export function setup() {
  waitForBackend();

  const uniquePart = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const username = `k6-org-${uniquePart}`;
  const password = 'Password123!';

  const registerResponse = http.post(
    `${apiBaseUrl}/auth/register`,
    {
      UserName: username,
      Email: `${username}@example.com`,
      Password: password,
      ConfirmPassword: password,
      AccountType: '2',
      'Organization.Name': 'k6 Performance Organization',
      'Organization.Website': 'https://example.com',
      image: imageFile('organization.png'),
    },
    { tags: { phase: 'setup', endpoint: 'register-organization' } },
  );
  requireStatus(registerResponse, 201, 'organization registration');

  // k6's cookie jar retains the authentication cookie returned by registration.
  const title = `k6 performance event ${uniquePart}`;
  const createResponse = http.post(
    `${apiBaseUrl}/events`,
    {
      Title: title,
      Description: 'Deterministic event created for public read performance tests.',
      Category: 'Technology',
      Format: 'In person',
      Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      LocationName: 'FINKI',
      Address: 'Rugjer Boshkovikj 16',
      Latitude: '42.004',
      Longitude: '21.409',
      GooglePlaceId: `k6-place-${uniquePart}`,
      image: imageFile('event.png'),
    },
    { tags: { phase: 'setup', endpoint: 'create-event' } },
  );
  requireStatus(createResponse, 201, 'event creation');

  const createdEvent = parseJson(createResponse);
  if (!createdEvent || !createdEvent.id) {
    throw new Error('Event creation did not return an event id.');
  }

  return {
    eventId: createdEvent.id,
    title,
    searchTerm: uniquePart,
  };
}

export function browseEvents(data) {
  const listResponse = http.get(
    `${apiBaseUrl}/events?scope=Upcoming&pageNumber=1&pageSize=9`,
    { tags: { endpoint: 'event-list' } },
  );
  const list = parseJson(listResponse);
  check(
    listResponse,
    {
      'event list returns 200': (response) => response.status === 200,
      'event list returns an items array': () => Array.isArray(list?.items),
    },
    { endpoint: 'event-list' },
  );

  const searchResponse = http.get(
    `${apiBaseUrl}/events?scope=Upcoming&search=${encodeURIComponent(data.searchTerm)}&category=Technology&pageNumber=1&pageSize=9`,
    { tags: { endpoint: 'event-search' } },
  );
  const search = parseJson(searchResponse);
  check(
    searchResponse,
    {
      'event search returns 200': (response) => response.status === 200,
      'event search finds the seeded event': () =>
        Array.isArray(search?.items) &&
        search.items.some((event) => event.id === data.eventId),
    },
    { endpoint: 'event-search' },
  );

  const detailsResponse = http.get(
    `${apiBaseUrl}/events/${data.eventId}`,
    { tags: { endpoint: 'event-details' } },
  );
  const details = parseJson(detailsResponse);
  check(
    detailsResponse,
    {
      'event details return 200': (response) => response.status === 200,
      'event details return the seeded event': () =>
        details?.id === data.eventId && details?.title === data.title,
    },
    { endpoint: 'event-details' },
  );

  sleep(1);
}

function waitForBackend() {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const response = http.get(
      `${apiBaseUrl}/events?pageNumber=1&pageSize=1`,
      { tags: { phase: 'setup', endpoint: 'backend-readiness' } },
    );

    if (response.status === 200) {
      return;
    }

    sleep(1);
  }

  throw new Error(`Backend did not become ready at ${apiBaseUrl}.`);
}

function imageFile(filename) {
  return http.file(pngBytes, filename, 'image/png');
}

function parseJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

function requireStatus(response, expectedStatus, operation) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${operation} returned ${response.status}; expected ${expectedStatus}. ` +
        `Response: ${String(response.body).slice(0, 500)}`,
    );
  }
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
