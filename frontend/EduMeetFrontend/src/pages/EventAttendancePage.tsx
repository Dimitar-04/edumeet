import axios from 'axios';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import {
  checkInEventParticipant,
  getEventAttendance,
  getEventById,
} from '../api/eventsApi';
import AttendanceQrScanner from '../components/events/AttendanceQrScanner';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import type { ValidationProblemDetails } from '../types/api/errors';
import type {
  AttendanceCheckInResponse,
  AttendanceSummaryResponse,
  EducationalEventResponse,
} from '../types/event/responses';

interface CheckInFeedback {
  kind: 'success' | 'already-checked-in' | 'error';
  title: string;
  detail: string;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ValidationProblemDetails>(error)) {
    return fallback;
  }

  const errors = error.response?.data.errors;
  const firstValidationError = errors
    ? Object.values(errors).flat()[0]
    : undefined;

  return (
    firstValidationError ??
    error.response?.data.detail ??
    error.response?.data.title ??
    fallback
  );
}

function EventAttendancePage() {
  const { eventId = '' } = useParams();
  const { user, isAuthLoading } = useAuth();
  const [event, setEvent] = useState<EducationalEventResponse | null>(null);
  const [attendance, setAttendance] =
    useState<AttendanceSummaryResponse | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) return;

    let isCurrentRequest = true;

    const loadAttendance = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        const loadedEvent = await getEventById(eventId);

        if (!loadedEvent) {
          throw new Error('The requested event does not exist.');
        }

        if (loadedEvent.organizerId !== user.id) {
          throw new Error('Only the event organizer can view attendance.');
        }

        const loadedAttendance = await getEventAttendance(eventId);

        if (!isCurrentRequest) return;

        setEvent(loadedEvent);
        setAttendance(loadedAttendance);
      } catch (error) {
        if (!isCurrentRequest) return;

        setLoadError(
          getApiErrorMessage(
            error,
            error instanceof Error
              ? error.message
              : 'Attendance could not be loaded.',
          ),
        );
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    void loadAttendance();

    return () => {
      isCurrentRequest = false;
    };
  }, [eventId, isAuthLoading, user]);

  const updateAttendanceAfterCheckIn = (
    response: AttendanceCheckInResponse,
  ) => {
    setAttendance((current) =>
      current
        ? {
            ...current,
            registeredPeopleCount: response.registeredPeopleCount,
            attendedPeopleCount: response.attendedPeopleCount,
            attendanceRate: response.attendanceRate,
            participants: current.participants.map((participant) =>
              participant.userId === response.participantUserId
                ? {
                    ...participant,
                    checkedInAtUtc: response.checkedInAtUtc,
                  }
                : participant,
            ),
          }
        : current,
    );
  };

  const submitAttendanceToken = async (attendanceToken: string) => {
    const token = attendanceToken.trim();

    if (!token || isCheckingIn) return;

    try {
      setIsCheckingIn(true);
      setFeedback(null);

      const response = await checkInEventParticipant(eventId, {
        attendanceToken: token,
      });

      updateAttendanceAfterCheckIn(response);
      setManualCode('');

      setFeedback(
        response.alreadyCheckedIn
          ? {
              kind: 'already-checked-in',
              title: 'Already checked in',
              detail: `${response.participantName} was checked in at ${new Date(
                response.checkedInAtUtc,
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}.`,
            }
          : {
              kind: 'success',
              title: 'Check-in successful',
              detail: `${response.participantName} has been marked as present.`,
            },
      );
    } catch (error) {
      setFeedback({
        kind: 'error',
        title: 'Code not accepted',
        detail: getApiErrorMessage(
          error,
          'This QR code could not be accepted. Please try again.',
        ),
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const submitManualCode = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    void submitAttendanceToken(manualCode);
  };

  if (!isAuthLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="app-shell attendance-shell">
        <AppHeader />
        <main className="attendance-page section-container" role="status">
          <p>Loading attendance&hellip;</p>
        </main>
      </div>
    );
  }

  if (!event || !attendance) {
    return (
      <div className="app-shell attendance-shell">
        <AppHeader />
        <main className="attendance-page section-container">
          <Link className="breadcrumb" to={`/events/${eventId}`}>
            &larr; Back to event
          </Link>
          <div className="empty-state" role="alert">
            <h1>Attendance unavailable</h1>
            <p>{loadError}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell attendance-shell">
      <AppHeader />

      <main className="attendance-page section-container">
        <Link className="breadcrumb" to={`/events/${event.id}`}>
          &larr; Back to {event.title}
        </Link>

        <header className="attendance-hero">
          <div>
            <p className="eyebrow">Organizer tools</p>
            <h1>Event attendance</h1>
            <p>Scan attendee QR codes as people arrive at {event.title}.</p>
          </div>
          <span>{new Date(event.date).toLocaleDateString('en', { dateStyle: 'medium' })}</span>
        </header>

        <dl className="attendance-stats">
          <div>
            <dt>Registered</dt>
            <dd>{attendance.registeredPeopleCount}</dd>
          </div>
          <div>
            <dt>Checked in</dt>
            <dd>{attendance.attendedPeopleCount}</dd>
          </div>
          <div>
            <dt>Attendance rate</dt>
            <dd>
              {attendance.attendanceRate === null
                ? '—'
                : `${attendance.attendanceRate.toFixed(1)}%`}
            </dd>
          </div>
        </dl>

        <div className="attendance-workspace">
          <AttendanceQrScanner
            disabled={isCheckingIn}
            onCodeDetected={submitAttendanceToken}
          />

          <section className="attendance-manual" aria-labelledby="manual-code-title">
            <p className="eyebrow">Camera fallback</p>
            <h2 id="manual-code-title">Enter a code manually</h2>
            <p>Use the code printed underneath the attendee&apos;s QR image.</p>

            <form onSubmit={submitManualCode}>
              <label htmlFor="attendance-code">Attendance code</label>
              <div>
                <input
                  id="attendance-code"
                  value={manualCode}
                  maxLength={100}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="Paste or type the attendance code"
                  onChange={(inputEvent) =>
                    setManualCode(inputEvent.target.value)
                  }
                />
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={isCheckingIn || !manualCode.trim()}
                >
                  {isCheckingIn ? 'Checking…' : 'Check in'}
                </button>
              </div>
            </form>
          </section>
        </div>

        {feedback ? (
          <section
            className={`attendance-feedback attendance-feedback-${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
          >
            <strong>{feedback.title}</strong>
            <p>{feedback.detail}</p>
          </section>
        ) : null}

        <section className="attendance-roster" aria-labelledby="attendance-roster-title">
          <div className="attendance-section-heading">
            <div>
              <p className="eyebrow">Guest list</p>
              <h2 id="attendance-roster-title">Registered attendees</h2>
            </div>
            <span>{attendance.participants.length}</span>
          </div>

          {attendance.participants.length ? (
            <div className="attendance-participant-list">
              {attendance.participants.map((participant) => (
                <article className="attendance-participant" key={participant.userId}>
                  <Link to={`/profile/${participant.userId}`}>
                    <UserAvatar
                      className="attendance-participant-avatar"
                      userName={participant.name}
                      imageUrl={participant.imageUrl}
                    />
                    <strong>{participant.name}</strong>
                  </Link>
                  <span className={participant.checkedInAtUtc ? 'is-present' : ''}>
                    {participant.checkedInAtUtc
                      ? `Checked in ${new Date(
                          participant.checkedInAtUtc,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Not arrived'}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="event-reviews-empty">No one has registered yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default EventAttendancePage;
