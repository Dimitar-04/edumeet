import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { getMyUpcomingSchedule } from '../api/eventsApi';
import EventCard from '../components/events/EventCard';
import AppHeader from '../components/layout/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { AccountType } from '../types/user/auth';
import type { EducationalEventResponse } from '../types/event/responses';

function MySchedulePage() {
  const { user, isAuthLoading } = useAuth();
  const [events, setEvents] = useState<EducationalEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isAuthLoading || !user || user.accountType !== AccountType.Individual) {
      return;
    }

    let isCurrentRequest = true;

    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const loadedEvents = await getMyUpcomingSchedule();

        if (isCurrentRequest) {
          setEvents(loadedEvents);
        }
      } catch {
        if (isCurrentRequest) {
          setLoadError(
            'Your schedule could not be loaded. Please try again shortly.',
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    void loadSchedule();

    return () => {
      isCurrentRequest = false;
    };
  }, [isAuthLoading, user]);

  if (!isAuthLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthLoading && user?.accountType !== AccountType.Individual) {
    return <Navigate to="/events" replace />;
  }

  return (
    <div className="app-shell schedule-shell">
      <AppHeader />

      <main className="schedule-page section-container">
        <header className="schedule-hero">
          <div>
            <h1>My schedule</h1>
            <p>The learning experiences ahead of you.</p>
          </div>
          {!isAuthLoading && !isLoading && !loadError ? (
            <div
              className="schedule-count"
              aria-label={`${events.length} upcoming events`}
            >
              <strong>{events.length}</strong>
              <span>upcoming</span>
            </div>
          ) : null}
        </header>

        {isAuthLoading || isLoading ? (
          <div className="empty-state" role="status">
            <h2>Loading your schedule&hellip;</h2>
            <p>Gathering the events you registered for.</p>
          </div>
        ) : loadError ? (
          <div className="empty-state" role="alert">
            <h2>We couldn&apos;t load your schedule</h2>
            <p>{loadError}</p>
          </div>
        ) : events.length > 0 ? (
          <section aria-labelledby="schedule-events-title">
            <div className="event-feed-heading schedule-heading">
              <div>
                <h2 id="schedule-events-title">Coming up</h2>
              </div>
              <span>{events.length}</span>
            </div>
            <div className="event-grid schedule-grid">
              {events.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state schedule-empty">
            <h2>Your schedule is open</h2>
            <p>Register for an upcoming event and it will appear here.</p>
            <Link className="button button-primary" to="/events">
              Browse events
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default MySchedulePage;
