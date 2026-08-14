import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getEventById } from '../api/eventsApi';
import { resolvePublicAssetUrl } from '../api/apiConfig';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import type { EducationalEventResponse } from '../types/event/responses';
import { AccountType } from '../types/user/auth';

function EventDetailsPage() {
  const { eventId = '' } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EducationalEventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);

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
      } catch {
        setLoadError('The event details could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvent();
  }, [eventId]);

  const toggleRegistration = () => {
    setIsRegistered((currentlyRegistered) => {
      setRegisteredCount((currentCount) =>
        currentlyRegistered
          ? Math.max(0, currentCount - 1)
          : currentCount + 1,
      );

      return !currentlyRegistered;
    });
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
          <Link className="breadcrumb" to="/events">&larr; Back to events</Link>
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
  const canRegister =
    user?.accountType === AccountType.Individual && !isOrganizer;

  return (
    <div className="app-shell event-details-shell">
      <AppHeader />

      <main className="event-details-page section-container">
        <Link className="breadcrumb" to="/events">&larr; Back to events</Link>

        <article className="event-details-card">
          <div className="event-details-cover">
            {event.imageUrl ? (
              <img
                src={resolvePublicAssetUrl(event.imageUrl)}
                alt=""
              />
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

            <aside className="event-details-aside" aria-label="Event information">
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
                <div>
                  <UserAvatar
                    className="event-details-avatar"
                    userName={event.organizerName}
                    imageUrl={event.organizerImageUrl}
                  />
                  <strong>{event.organizerName}</strong>
                </div>
              </section>

              <section className="event-registration-panel">
                <span>Attendance</span>
                <strong>
                  {registeredCount}{' '}
                  {registeredCount === 1 ? 'person is' : 'people are'} registered
                </strong>
                <p>Reserve your place and join this learning community.</p>

                {!user ? (
                  <Link className="button button-primary" to="/login">
                    Log in to register
                  </Link>
                ) : canRegister ? (
                  <button
                    className={
                      isRegistered
                        ? 'button button-secondary'
                        : 'button button-primary'
                    }
                    type="button"
                    onClick={toggleRegistration}
                  >
                    {isRegistered ? 'Cancel registration' : 'Register for event'}
                  </button>
                ) : null}
              </section>
            </aside>
          </div>
        </article>
      </main>
    </div>
  );
}

export default EventDetailsPage;
