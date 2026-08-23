import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getEvents } from '../api/eventsApi';
import AppHeader from '../components/layout/AppHeader';
import type { EducationalEventResponse } from '../types/event/responses';

function LandingPage() {
  const [events, setEvents] = useState<EducationalEventResponse[]>([]);
  const [statsUnavailable, setStatsUnavailable] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const firstEventPage = await getEvents({ pageSize: 24 });
        const remainingEventPages = await Promise.all(
          Array.from(
            { length: Math.max(0, firstEventPage.totalPages - 1) },
            (_, index) =>
              getEvents({
                pageNumber: index + 2,
                pageSize: firstEventPage.pageSize,
              }),
          ),
        );
        const allEvents = [
          ...firstEventPage.items,
          ...remainingEventPages.flatMap((page) => page.items),
        ];
        const now = Date.now();

        setEvents(
          allEvents
            .filter((event) => new Date(event.date).getTime() > now)
            .sort(
              (first, second) =>
                new Date(first.date).getTime() -
                new Date(second.date).getTime(),
            ),
        );
      } catch {
        setStatsUnavailable(true);
      }
    };

    void loadSummary();
  }, []);

  const organizerCount = useMemo(
    () => new Set(events.map((event) => event.organizerId)).size,
    [events],
  );
  const categoryCount = useMemo(
    () => new Set(events.map((event) => event.category)).size,
    [events],
  );
  const nextEvent = events[0];
  const nextEventDate = nextEvent ? new Date(nextEvent.date) : null;

  return (
    <div className="app-shell landing-shell">
      <AppHeader />

      <main>
        <section className="landing-hero section-container" aria-labelledby="landing-title">
          <div className="landing-copy">
            <p className="eyebrow">A community built around curiosity</p>
            <h1 id="landing-title">
              Meet people.<br />Share knowledge.<br />Keep learning.
            </h1>
            <p>
              EduMeet brings local workshops, talks, and learning communities
              into one thoughtful place.
            </p>
            <div className="landing-actions">
              <Link className="button button-primary" to="/events">
                Browse events
              </Link>
              <Link className="button button-secondary" to="/events/create">
                Host an event
              </Link>
            </div>
          </div>

          <aside className="landing-next" aria-label="Next event on EduMeet">
            <p>{nextEvent ? 'Coming up next' : 'Start something meaningful'}</p>
            <strong>
              {nextEvent?.title ?? 'Your knowledge can bring people together.'}
            </strong>
            {nextEvent && nextEventDate ? (
              <div className="landing-next-details">
                <span>{nextEvent.category}</span>
                <span>
                  {nextEventDate.toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>{nextEvent.locationName}</span>
              </div>
            ) : (
              <Link to="/events/create">Create the first event</Link>
            )}
          </aside>
        </section>

        <section className="landing-stat-band" aria-label="EduMeet statistics">
          <dl className="section-container landing-stats">
            <div>
              <dt>{statsUnavailable ? '—' : events.length}</dt>
              <dd>upcoming events</dd>
            </div>
            <div>
              <dt>{statsUnavailable ? '—' : organizerCount}</dt>
              <dd>active organizers</dd>
            </div>
            <div>
              <dt>{statsUnavailable ? '—' : categoryCount}</dt>
              <dd>areas to explore</dd>
            </div>
          </dl>
        </section>

        <section className="landing-invitation section-container">
          <p className="eyebrow">Made for participation</p>
          <h2>Learning feels different when it happens together.</h2>
          <p>
            Find a room full of people interested in the same questions—or
            create that room yourself.
          </p>
          <Link className="text-link" to="/events">
            See what is happening
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-container footer-inner">
          <p>&copy; 2026 EduMeet</p>
          <p>Knowledge has a place.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
