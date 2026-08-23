import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router';
import {
  createEventReview,
  deleteCurrentUserEventReview,
  getEventById,
  toggleEventRegistration,
} from '../api/eventsApi';
import { resolvePublicAssetUrl } from '../api/apiConfig';
import EventRegistrationDialog, {
  type RegistrationAction,
  type RegistrationDialogPhase,
} from '../components/events/EventRegistrationDialog';
import DeleteReviewDialog from '../components/events/DeleteReviewDialog';
import EventReviewDialog, {
  type ReviewDialogPhase,
} from '../components/events/EventReviewDialog';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import type {
  ProblemDetails,
  ValidationProblemDetails,
} from '../types/api/errors';
import type { EducationalEventResponse } from '../types/event/responses';
import { AccountType } from '../types/user/auth';

function EventDetailsPage() {
  const { eventId = '' } = useParams();
  const { user } = useAuth();
  const [pageLoadedAt] = useState(() => Date.now());
  const [event, setEvent] = useState<EducationalEventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isUpdatingRegistration, setIsUpdatingRegistration] = useState(false);
  const [registrationDialog, setRegistrationDialog] = useState<{
    open: boolean;
    phase: RegistrationDialogPhase;
    action: RegistrationAction;
    errorMessage?: string;
  }>({
    open: false,
    phase: 'confirm',
    action: 'register',
  });
  const [reviewGrade, setReviewGrade] = useState(0);
  const [reviewDescription, setReviewDescription] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    phase: ReviewDialogPhase;
    errorMessage?: string;
  }>({ open: false, phase: 'form' });
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{
    open: boolean;
    errorMessage?: string;
  }>({ open: false });
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const loadedEvent = await getEventById(eventId);

        if (!loadedEvent) {
          setLoadError('This event could not be found.');
          return;
        }

        setEvent(loadedEvent);
        setIsRegistered(loadedEvent.isCurrentUserRegistered);
        setRegisteredCount(loadedEvent.registeredPeopleCount);
      } catch {
        setLoadError('The event details could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvent();
  }, [eventId]);

  const openRegistrationDialog = () => {
    setRegistrationDialog({
      open: true,
      phase: 'confirm',
      action: isRegistered ? 'unregister' : 'register',
    });
  };

  const closeRegistrationDialog = () => {
    if (isUpdatingRegistration) return;

    setRegistrationDialog((current) => ({ ...current, open: false }));
  };

  const confirmRegistrationChange = async () => {
    if (!event) return;

    try {
      setIsUpdatingRegistration(true);
      const response = await toggleEventRegistration(event.id);

      setIsRegistered(response.isRegistered);
      setRegisteredCount(response.registeredPeopleCount);
      setRegistrationDialog((current) => ({
        ...current,
        phase: 'success',
        errorMessage: undefined,
      }));
    } catch (error) {
      let errorMessage = 'Please try again.';

      if (axios.isAxiosError<ProblemDetails>(error)) {
        errorMessage =
          error.response?.data.detail ??
          error.response?.data.title ??
          errorMessage;
      }

      setRegistrationDialog((current) => ({
        ...current,
        phase: 'error',
        errorMessage,
      }));
    } finally {
      setIsUpdatingRegistration(false);
    }
  };

  const closeReviewDialog = () => {
    if (isSubmittingReview) return;

    if (reviewDialog.phase === 'success') {
      setReviewGrade(0);
      setReviewDescription('');
    }
    setReviewDialog((current) => ({ ...current, open: false }));
  };

  const submitReview = async () => {
    if (!event) return;

    try {
      setIsSubmittingReview(true);
      const response = await createEventReview(event.id, {
        grade: reviewGrade,
        description: reviewDescription.trim(),
      });

      setEvent((current) =>
        current
          ? {
              ...current,
              averageRating: response.averageRating,
              ratingCount: response.ratingCount,
              hasCurrentUserReviewed: true,
              reviews: [response.review, ...current.reviews],
            }
          : current,
      );
      setReviewDialog({ open: true, phase: 'success' });
    } catch (error) {
      let errorMessage = 'Please try again.';

      if (axios.isAxiosError<ValidationProblemDetails>(error)) {
        const errors = error.response?.data.errors;
        const firstError = errors ? Object.values(errors).flat()[0] : undefined;

        errorMessage =
          firstError ??
          error.response?.data.detail ??
          error.response?.data.title ??
          errorMessage;
      }

      setReviewDialog({ open: true, phase: 'error', errorMessage });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const closeDeleteReviewDialog = () => {
    if (isDeletingReview) return;
    setDeleteReviewDialog({ open: false });
  };

  const deleteReview = async () => {
    if (!event || !user) return;

    try {
      setIsDeletingReview(true);
      setDeleteReviewDialog({ open: true });
      const response = await deleteCurrentUserEventReview(event.id);

      setEvent((current) =>
        current
          ? {
              ...current,
              averageRating: response.averageRating,
              ratingCount: response.ratingCount,
              hasCurrentUserReviewed: false,
              reviews: current.reviews.filter(
                (review) => review.reviewerId !== user.id,
              ),
            }
          : current,
      );
      setDeleteReviewDialog({ open: false });
    } catch (error) {
      let errorMessage = 'Your review could not be removed. Please try again.';

      if (axios.isAxiosError<ProblemDetails>(error)) {
        errorMessage =
          error.response?.data.detail ??
          error.response?.data.title ??
          errorMessage;
      }

      setDeleteReviewDialog({ open: true, errorMessage });
    } finally {
      setIsDeletingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-shell event-details-shell">
        <AppHeader />
        <main className="event-details-page section-container" role="status">
          <p>Loading event details&hellip;</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-shell event-details-shell">
        <AppHeader />
        <main className="event-details-page section-container">
          <Link className="breadcrumb" to="/events">
            &larr; Back to events
          </Link>
          <div className="empty-state" role="alert">
            <h1>Event unavailable</h1>
            <p>{loadError}</p>
          </div>
        </main>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const eventInitials = event.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.latitude},${event.longitude}`,
  )}`;
  const isOrganizer = user?.id === event.organizerId;
  const hasEventPassed = eventDate.getTime() <= pageLoadedAt;
  const canRegister =
    user?.accountType === AccountType.Individual &&
    !isOrganizer &&
    !hasEventPassed;
  const canReview =
    user?.accountType === AccountType.Individual &&
    !isOrganizer &&
    hasEventPassed &&
    isRegistered &&
    !event.hasCurrentUserReviewed;

  return (
    <div className="app-shell event-details-shell">
      <AppHeader />

      <main className="event-details-page section-container">
        <Link className="breadcrumb" to="/events">
          &larr; Back to events
        </Link>

        <article className="event-details-card">
          <div className="event-details-cover">
            {event.imageUrl ? (
              <img src={resolvePublicAssetUrl(event.imageUrl)} alt="" />
            ) : (
              <span aria-hidden="true">{eventInitials}</span>
            )}
            <strong>{event.category}</strong>
          </div>

          <div className="event-details-content">
            <div className="event-details-main">
              <p className="event-details-meta">
                {event.format} &middot;{' '}
                {eventDate.toLocaleDateString('en', { dateStyle: 'long' })}
                {' at '}
                {eventDate.toLocaleTimeString('en', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <h1>{event.title}</h1>
              <p className="event-details-description">{event.description}</p>
            </div>

            <aside
              className="event-details-aside"
              aria-label="Event information"
            >
              <section>
                <span>Location</span>
                <strong>{event.locationName}</strong>
                <p>{event.address}</p>
                <a href={mapUrl} target="_blank" rel="noreferrer">
                  View on Google Maps
                </a>
              </section>

              <section className="event-details-organizer">
                <span>Hosted by</span>
                <Link
                  className="event-organizer-link"
                  to={`/profile/${event.organizerId}`}
                >
                  <UserAvatar
                    className="event-details-avatar"
                    userName={event.organizerName}
                    imageUrl={event.organizerImageUrl}
                  />
                  <strong>{event.organizerName}</strong>
                </Link>
              </section>

              <section className="event-registration-panel">
                <span>Attendance</span>
                <strong>
                  {hasEventPassed ? event.attendedPeopleCount : registeredCount}{' '}
                  {(hasEventPassed
                    ? event.attendedPeopleCount
                    : registeredCount) === 1
                    ? 'person '
                    : 'people '}
                  {hasEventPassed ? 'attended' : 'registered'}
                </strong>
                <p>
                  {hasEventPassed
                    ? 'Attendance confirmed through event check-in.'
                    : 'Reserve your place and join this learning community.'}
                </p>

                {isOrganizer ? (
                  <Link
                    className="button button-primary"
                    to={`/events/${event.id}/attendance`}
                  >
                    Manage attendance
                  </Link>
                ) : null}

                {!hasEventPassed && !user ? (
                  <Link className="button button-primary" to="/login">
                    Log in to register for event
                  </Link>
                ) : canRegister ? (
                  <button
                    className={
                      isRegistered
                        ? 'button button-danger-outline'
                        : 'button button-primary'
                    }
                    type="button"
                    onClick={openRegistrationDialog}
                  >
                    {isRegistered
                      ? 'Unregister for event'
                      : 'Register for event'}
                  </button>
                ) : null}
              </section>

              {hasEventPassed ? (
                <section className="event-review-panel">
                  <span>Event rating</span>
                  <strong>
                    {event.averageRating === null
                      ? 'Not rated yet'
                      : `${event.averageRating.toFixed(1)} / 5`}
                  </strong>
                  <p>
                    {event.ratingCount}{' '}
                    {event.ratingCount === 1 ? 'review' : 'reviews'} submitted
                  </p>

                  {event.hasCurrentUserReviewed ? (
                    <p className="event-review-complete" role="status">
                      Your review has been submitted
                    </p>
                  ) : canReview ? (
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() =>
                        setReviewDialog({ open: true, phase: 'form' })
                      }
                    >
                      Write a review
                    </button>
                  ) : !user ? (
                    <Link className="button button-secondary" to="/login">
                      Log in to review
                    </Link>
                  ) : user.accountType === AccountType.Individual &&
                    !isOrganizer &&
                    !isRegistered ? (
                    <p>Only registered attendees can review this event.</p>
                  ) : null}
                </section>
              ) : null}
            </aside>
          </div>

          {hasEventPassed ? (
            <section
              className="event-reviews"
              aria-labelledby="event-reviews-title"
            >
              <div className="event-reviews-heading">
                <div>
                  <p className="eyebrow">Attendee feedback</p>
                  <h2 id="event-reviews-title">Reviews</h2>
                </div>
                <span>{event.ratingCount}</span>
              </div>

              {event.reviews.length ? (
                <div className="event-review-list">
                  {event.reviews.map((review) => (
                    <article
                      className="event-review-card"
                      key={`${review.reviewerId}-${review.grade}`}
                    >
                      <div className="event-review-author">
                        <Link to={`/profile/${review.reviewerId}`}>
                          <UserAvatar
                            className="event-review-avatar"
                            userName={review.reviewerName}
                            imageUrl={review.reviewerImageUrl}
                          />
                          <strong>{review.reviewerName}</strong>
                        </Link>
                        <div className="event-review-card-actions">
                          <span>Rated: {review.grade} / 5</span>
                          {review.reviewerId === user?.id ? (
                            <button
                              className="event-review-delete-button"
                              type="button"
                              aria-label="Remove your review"
                              title="Remove review"
                              onClick={() =>
                                setDeleteReviewDialog({ open: true })
                              }
                            >
                              <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p>{review.description}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="event-reviews-empty">
                  No attendee reviews have been submitted yet.
                </p>
              )}
            </section>
          ) : null}
        </article>
      </main>

      <EventRegistrationDialog
        open={registrationDialog.open}
        phase={registrationDialog.phase}
        action={registrationDialog.action}
        eventTitle={event.title}
        isSubmitting={isUpdatingRegistration}
        errorMessage={registrationDialog.errorMessage}
        onConfirm={() => void confirmRegistrationChange()}
        onClose={closeRegistrationDialog}
      />
      <EventReviewDialog
        open={reviewDialog.open}
        phase={reviewDialog.phase}
        eventTitle={event.title}
        grade={reviewGrade}
        description={reviewDescription}
        isSubmitting={isSubmittingReview}
        errorMessage={reviewDialog.errorMessage}
        onGradeChange={setReviewGrade}
        onDescriptionChange={setReviewDescription}
        onSubmit={() => void submitReview()}
        onClose={closeReviewDialog}
      />
      <DeleteReviewDialog
        open={deleteReviewDialog.open}
        eventTitle={event.title}
        isSubmitting={isDeletingReview}
        errorMessage={deleteReviewDialog.errorMessage}
        onConfirm={() => void deleteReview()}
        onClose={closeDeleteReviewDialog}
      />
    </div>
  );
}

export default EventDetailsPage;
