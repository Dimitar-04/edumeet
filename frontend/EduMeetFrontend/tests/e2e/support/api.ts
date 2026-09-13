import { expect, type APIRequestContext } from '@playwright/test';

export const apiBaseUrl = 'http://localhost:5063/api';
export const testPassword = 'Password123!';

interface AuthenticationResponse {
  user: {
    id: string;
    userName: string;
  };
}

export interface CreatedEvent {
  id: string;
  title: string;
}

export function uniqueName(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function registerIndividual(
  request: APIRequestContext,
  username: string,
) {
  const response = await request.post(`${apiBaseUrl}/auth/register`, {
    multipart: {
      UserName: username,
      Email: `${username}@example.com`,
      Password: testPassword,
      ConfirmPassword: testPassword,
      AccountType: '1',
      'Individual.FirstName': 'E2E',
      'Individual.LastName': 'Student',
    },
  });

  expect(response.status(), await response.text()).toBe(201);
  return response.json() as Promise<AuthenticationResponse>;
}

export async function registerOrganization(
  request: APIRequestContext,
  username: string,
) {
  const response = await request.post(`${apiBaseUrl}/auth/register`, {
    multipart: {
      UserName: username,
      Email: `${username}@example.com`,
      Password: testPassword,
      ConfirmPassword: testPassword,
      AccountType: '2',
      'Organization.Name': `${username} Organization`,
      'Organization.Website': 'https://example.com',
    },
  });

  expect(response.status(), await response.text()).toBe(201);
  return response.json() as Promise<AuthenticationResponse>;
}

export async function createEvent(
  request: APIRequestContext,
  title: string,
  date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1_000),
  category = 'Technology',
) {
  const response = await request.post(`${apiBaseUrl}/events`, {
    multipart: {
      Title: title,
      Description: 'A browser-tested EduMeet learning event.',
      Category: category,
      Format: 'Workshop',
      Date: date.toISOString(),
      LocationName: 'FINKI',
      Address: 'Rugjer Boshkovikj 16, Skopje',
      Latitude: '42.004',
      Longitude: '21.409',
      GooglePlaceId: 'e2e-finki-place',
    },
  });

  expect(response.status(), await response.text()).toBe(201);
  return response.json() as Promise<CreatedEvent>;
}
