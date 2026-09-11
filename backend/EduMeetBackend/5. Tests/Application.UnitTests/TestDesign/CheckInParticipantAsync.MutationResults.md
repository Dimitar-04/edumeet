# `CheckInParticipantAsync` Mutation Results

Stryker.NET 4.16.0, Standard mutation level. The final run tested 28
in-scope mutants: 28 killed, 0 survived, for a 100% mutation score.

| ID | Line | Mutation | Original | Replacement | Main detecting test |
|---:|---:|---|---|---|---|
| 236 | 503 | Equality | `organizer is null` | `organizer is not null` | Multiple valid-path tests |
| 238 | 505 | Statement removal | Throw missing-organizer exception | `;` | `WhenOrganizerDoesNotExist` |
| 239 | 506 | String | Organizer error message | `""` | `WhenOrganizerDoesNotExist` |
| 240 | 514 | Equality | `educationalEvent is null` | `educationalEvent is not null` | Multiple event-path tests |
| 242 | 516 | Statement removal | Throw missing-event exception | `;` | `WhenEventDoesNotExist` |
| 243 | 517 | String | Event error message | `""` | `WhenEventDoesNotExist` |
| 244 | 520 | Equality | `OrganizerId != organizer.Id` | `OrganizerId == organizer.Id` | Multiple ownership-path tests |
| 246 | 522 | Statement removal | Throw forbidden exception | `;` | `WhenOrganizerDoesNotOwnEvent` |
| 247 | 523 | String | Ownership error message | `""` | `WhenOrganizerDoesNotOwnEvent` |
| 248 | 530 | Unary | `-1` hour | `+1` hour | Time-window tests |
| 249 | 535 | Equality | `nowUtc < checkInOpensAtUtc` | `nowUtc > checkInOpensAtUtc` | Before-opening and valid-path tests |
| 250 | 535 | Equality | `nowUtc < checkInOpensAtUtc` | `nowUtc <= checkInOpensAtUtc` | `AtOpeningBoundary` |
| 251 | 535 | Negation | `nowUtc < checkInOpensAtUtc` | `!(nowUtc < checkInOpensAtUtc)` | Before-opening and valid-path tests |
| 253 | 537 | Statement removal | Throw not-open exception | `;` | `WhenCheckInHasNotOpened` |
| 254 | 538 | String | Not-open error message | `""` | `WhenCheckInHasNotOpened` |
| 255 | 541 | Equality | `nowUtc > checkInClosesAtUtc` | `nowUtc < checkInClosesAtUtc` | Closed-window and valid-path tests |
| 256 | 541 | Equality | `nowUtc > checkInClosesAtUtc` | `nowUtc >= checkInClosesAtUtc` | `AtClosingBoundary` |
| 257 | 541 | Negation | `nowUtc > checkInClosesAtUtc` | `!(nowUtc > checkInClosesAtUtc)` | Closed-window and valid-path tests |
| 259 | 543 | Statement removal | Throw closed exception | `;` | `WhenCheckInHasClosed` |
| 260 | 544 | String | Closed error message | `""` | `WhenCheckInHasClosed` |
| 261 | 552 | LINQ method | `SingleOrDefault(...)` | `Single(...)` | `WhenAttendanceTokenIsInvalid` |
| 262 | 554 | Equality | Token hashes are equal | Token hashes are not equal | Token-validity tests |
| 263 | 557 | Equality | `eventParticipant is null` | `eventParticipant is not null` | Token-validity tests |
| 265 | 559 | Statement removal | Throw invalid-token exception | `;` | `WhenAttendanceTokenIsInvalid` |
| 266 | 560 | String | Invalid-token error message | `""` | `WhenAttendanceTokenIsInvalid` |
| 267 | 566 | Logical negation | `!alreadyCheckedIn` | `alreadyCheckedIn` | New and repeated check-in tests |
| 269 | 572 | Statement removal | `SaveChangesAsync(...)` | `;` | Successful check-in tests |
| 272 | 594 | String | Participant full name | `$""` | BCC successful base case |

The first correctly scoped run left mutants 250 and 256 alive. The exact
opening- and closing-boundary tests were then added, and the final run killed
both. Generated HTML and JSON reports remain under `StrykerOutput/` and are not
committed because they are timestamped run artifacts.
