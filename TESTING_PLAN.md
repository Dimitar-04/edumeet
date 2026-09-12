# EduMeet Testing Plan

## 1. Objective

The goal is to test EduMeet through multiple testing levels, with each level
targeting a different category of defect. Test selection is risk-based: the most
detailed coverage is assigned to workflows involving authorization, business
rules, persistent state, external services, or multiple application layers.

The formal testing strategies from the course will be applied to one method
only. Other parts of the application will receive practical unit, integration,
API, UI, end-to-end, and load tests.

## 2. Agreed Scope

Included:

- Functionality-based Input Space Partitioning (ISP) with Base Choice Coverage.
- Source-code mutation testing with Stryker.NET.
- Backend unit tests.
- Targeted frontend component tests.
- PostgreSQL integration tests.
- HTTP API tests.
- Browser end-to-end tests.
- Performance/load tests.
- Mocks for appropriate internal and external dependencies.
- Automated execution through GitHub Actions.

Excluded:

- Graph coverage.
- Security testing.
- Exhaustive tests for trivial getters, setters, and static UI.
- Final project documentation and presentation preparation; these will be
  planned separately.

## 3. Formal Testing Target

Both formal strategies will be applied to:

```csharp
EducationalEventService.CheckInParticipantAsync
```

This method was selected because it is business-critical and contains several
meaningful decisions involving organizer existence, event existence,
authorization, time, token validation, previous state, state modification, and
attendance calculations.

## 4. ISP Base Choice Coverage

The ISP model is functionality-based. Its characteristics come from the
method's business behavior and repository state rather than only from the data
types in the method signature.

### Characteristics and blocks

| Characteristic | Base block | Non-base block(s) |
|---|---|---|
| Organizer | Exists | Missing |
| Event | Exists | Missing |
| Ownership | Organizer owns event | Organizer does not own event |
| Check-in time | Window is open | Before opening; after closing |
| Attendance token | Matches a participant | Does not match |
| Check-in state | Not checked in | Already checked in |

The valid time block includes both boundaries:

```text
event.Date - 1 hour <= current time <= event.Date + 12 hours
```

### Base case

```text
Existing organizer
+ existing event
+ organizer owns the event
+ open check-in window
+ matching attendance token
+ participant not previously checked in
= successful first check-in
```

### Generated BCC cases

| ID | Changed block | Expected result | Status |
|---|---|---|---|
| BC1 | None: all base blocks | Successful first check-in | Complete |
| BC2 | Organizer is missing | `NotFoundException` | Complete |
| BC3 | Event is missing | `NotFoundException` | Complete |
| BC4 | Organizer does not own event | `ForbiddenException` | Complete |
| BC5 | Check-in has not opened | `ConflictException` | Complete |
| BC6 | Check-in has closed | `ConflictException` | Complete |
| BC7 | Token does not match | `NotFoundException` | Complete |
| BC8 | Participant already checked in | Success without another save | Complete |

Each variation changes one non-base block while other applicable
characteristics remain at their base blocks. Characteristics after a failed
guard are considered not applicable because they cannot affect that execution.

## 5. Source-Code Mutation Testing

Stryker.NET will apply standard source-code mutations only to the configured
source span containing `CheckInParticipantAsync`. The rest of
`EducationalEventService` is excluded by the mutate filter.

Implementation steps:

1. Confirm that the original eight BCC tests pass.
2. Generate mutants for operators, conditions, assignments, literals, LINQ,
   and removable statements in the selected method.
3. Run only `EducationalEventServiceCheckInTests` against the mutants.
4. Inspect killed, surviving, uncovered, timed-out, and compile-error mutants.
5. Add useful tests for meaningful surviving mutants.
6. Identify any equivalent mutant that cannot change observable behavior.
7. Save HTML and JSON reports as generated test artifacts.

The initial quality target is an 80% or higher mutation score, with every
surviving mutant individually analyzed. The preferred result is that all
non-equivalent mutants are killed.

Current result: Stryker generated 28 in-scope mutants. The original BCC suite
killed 26; the two survivors changed the opening and closing comparisons to
include equality. Two exact-boundary tests were added, after which all 28
mutants were killed for a 100% mutation score.

## 6. Backend Unit Tests

Tools:

- xUnit
- NSubstitute
- Coverlet
- A fixed `TimeProvider` for deterministic time-dependent tests

### Check-in service

The eight BCC tests verify:

- returned participant and event information;
- attendance timestamp and checker ID;
- registered and attended counts;
- attendance rate;
- exception type and message;
- saving exactly once for a new check-in;
- no saving after rejected or repeated operations;
- no calls to dependencies located after a failed guard.

### Attendance-token service

Planned representative tests:

- generated token follows the expected `XXXX-XXXX-XXXX` format;
- equivalent user-entered formatting is normalized consistently;
- hashing is deterministic and different tokens produce different hashes.

### Event registration

Planned representative tests:

- an eligible individual can register;
- a repeated registration request unregisters the individual;
- an organizer, wrong account type, or late registration is rejected.

### Reviews

Planned representative tests:

- a checked-in participant can review a completed event;
- a participant who did not attend cannot review it;
- a duplicate review or organizer self-review is rejected.

### Authentication and sessions

Planned representative tests:

- JWT contains the required identity and account-type claims;
- refresh-token hashing is deterministic;
- invalid, expired, or revoked refresh credentials are rejected.

### Profile and file boundaries

Planned representative tests:

- supported image type and size are accepted;
- excessive size or unsupported type is rejected.

Mocks will isolate business logic from repositories, file storage, email,
external APIs, and the real clock. Trivial property assignments and framework
behavior will not receive dedicated unit tests.

## 7. Backend Coverage Measurement

Coverlet will generate line and branch coverage reports. Coverage will be used
to find missing meaningful behavior rather than to create tests only for a
larger percentage.

Initial targets for the tested application-service scope:

- at least 80% line coverage;
- at least 70% branch coverage;
- all feasible BCC blocks covered;
- all feasible edges of the selected method covered.

Generated migrations and trivial data-model properties will not determine the
quality of the coverage result.

## 8. PostgreSQL Integration Tests

Testcontainers will start an isolated PostgreSQL instance. The tests will use
the real Entity Framework configuration and migrations.

Selected areas:

- migrations apply successfully;
- important uniqueness and relationship constraints work;
- event search, filtering, ordering, and pagination return correct results;
- registered future events appear in a user's schedule;
- checked-in completed events appear in attendance history;
- email-outbox records are created and their processing state is persisted.

Each test will receive isolated or reset database state. An in-memory database
will not replace PostgreSQL because its behavior can differ from the production
provider.

## 9. Frontend Component Tests

Tools:

- Vitest
- React Testing Library
- `user-event`
- Mock Service Worker (MSW)

Selected areas:

### API client and authentication

- normal successful request;
- unauthorized response triggers one refresh and retries the request;
- concurrent unauthorized requests do not trigger multiple refreshes;
- failed refresh clears the authentication state;
- logout clears the client session.

### Representative forms

- valid form creates the expected request or `FormData`;
- validation errors are displayed;
- backend errors are converted into useful UI feedback.

### QR scanner

- a valid scan is submitted once;
- repeated scanner events do not create duplicate submissions;
- permission or scanner failure is displayed safely.

### Google Maps location picker

- initial coordinates are loaded;
- selecting a location updates the address and coordinates;
- unavailable or failed Maps initialization is handled.

Google Maps and physical camera behavior will be mocked. The tests verify how
EduMeet reacts to those integrations, not the internal behavior of third-party
services or hardware.

## 10. HTTP API Tests

API tests will call a running backend with a real PostgreSQL database. Clients
will preserve authentication cookies between requests.

Every API operation will receive one positive smoke test. Detailed negative
cases will be concentrated on business-critical operations.

Selected groups:

- authentication: registration, login, refresh, current session, logout, and
  invalid credentials;
- profiles: retrieve, update, and reject unauthorized modification;
- events: list, filter, retrieve details, create, and reject unauthorized
  creation;
- participation: register, unregister, reject ineligible users, valid check-in,
  invalid token, and wrong organizer;
- reviews: create as an eligible attendee, reject ineligible users, and delete
  an owned review.

Assertions will check status codes and, where relevant, response bodies,
cookies, database state, and absence of unintended state changes.

## 11. Browser End-to-End Tests

Playwright will execute six principal user journeys against the real frontend,
backend, and PostgreSQL database:

1. A guest browses, searches, filters, and opens event details.
2. An individual registers, logs in, reloads the session, and logs out.
3. A user views and updates a profile and sees the persisted result.
4. An organization creates an event and sees it in the application.
5. An individual registers for an event and sees it in the schedule.
6. An organizer checks in a participant, after which the participant creates
   and deletes a review.

Test data will use unique users and events and will be prepared through public
APIs wherever possible. Time-dependent completed-event state may be prepared
directly in the test database; no test-only production endpoint will be added.

Google Maps will be mocked only at the external browser boundary. EduMeet's
frontend, backend, authentication, database, and workflows will remain real.

One important journey will also run at a mobile viewport. Representative pages
will receive keyboard and automated accessibility checks without creating a
large duplicate suite.

## 12. Docker Responsibilities

Docker is infrastructure for reproducible system tests; Docker itself is not
the subject of testing.

Docker Compose will provide:

- isolated PostgreSQL;
- database migrations;
- ASP.NET Core backend;
- React frontend;
- health checks and predictable test ports.

Docker Compose will be used for API, E2E, and load testing. Unit and frontend
component tests do not require Docker. PostgreSQL integration tests will use a
smaller Testcontainers-managed database rather than the complete Compose stack.

The test environment will use disposable data and will not reuse production or
development database volumes.

## 13. Performance and Load Tests

k6 will target public read-heavy operations:

- event listing;
- event search and filtering;
- event details.

Initial scenario:

- short warm-up;
- approximately 10 virtual users;
- approximately 60 seconds of measured execution;
- failed requests below 1%;
- 95th-percentile response time below 750 ms.

These thresholds provide a repeatable baseline rather than a claim of full
production capacity. Results must be interpreted in relation to the machine and
Docker environment used for the run.

## 14. Continuous Integration

The planned GitHub Actions order is:

1. Restore dependencies.
2. Build the backend.
3. Run backend unit tests.
4. Build the frontend.
5. Run frontend component tests.
6. Run PostgreSQL integration tests.
7. Start the Docker test environment.
8. Run API tests.
9. Run Chromium E2E tests.
10. Publish coverage and failure artifacts.
11. Stop and clean the test environment.

Additional browsers and k6 can run manually or on a schedule because they are
slower and more sensitive to the execution environment.

## 15. Implementation Order and Progress

- [x] Create the backend unit-test project.
- [x] Add xUnit, NSubstitute, and Coverlet.
- [x] Implement the successful BCC base case.
- [x] Implement all non-base BCC cases.
- [x] Configure and run mutation testing for `CheckInParticipantAsync`.
- [x] Analyze surviving mutants and strengthen the selected tests.
- [x] Add remaining backend unit tests.
- [x] Skip backend coverage measurement by agreement.
- [x] Add PostgreSQL integration-test infrastructure and tests.
- [ ] Add frontend component-test infrastructure and tests.
- [ ] Prepare the isolated Docker test environment.
- [ ] Add HTTP API tests.
- [ ] Add Playwright infrastructure and E2E journeys.
- [ ] Add representative accessibility and mobile checks.
- [ ] Add k6 load tests.
- [ ] Add unified local test commands.
- [ ] Add GitHub Actions.
- [ ] Run and stabilize the complete suite from a clean checkout.

## 16. Completion Criteria

The testing implementation is complete when:

- every feasible BCC block is tested;
- mutation testing is restricted to `CheckInParticipantAsync` and every
  surviving mutant is analyzed;
- selected backend business rules have unit tests;
- PostgreSQL-specific behavior is verified;
- every API operation has a positive smoke test;
- critical API operations have negative tests;
- all six E2E journeys pass;
- load-test thresholds are measurable;
- the complete suite passes repeatedly without manually prepared data;
- production backend and frontend builds continue to succeed.
