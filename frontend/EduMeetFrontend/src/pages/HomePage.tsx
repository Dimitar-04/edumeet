import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getEvents } from '../api/eventsApi';
import AppHeader from '../components/layout/AppHeader';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import type { EventCategory } from '../types/event/common';
import type { EducationalEventResponse } from '../types/event/responses';

function HomePage() {
  const [events, setEvents] = useState<EducationalEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'All'>(
    'All',
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEvents(await getEvents());
      } catch {
        setLoadError('Events could not be loaded. Please try again shortly.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();
  }, []);

  const visibleEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesCategory =
        activeCategory === 'All' || event.category === activeCategory;
      const matchesSearch =
        !query ||
        `${event.title} ${event.locationName} ${event.category}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, events, searchTerm]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = Date.now();

    return {
      upcomingEvents: visibleEvents
        .filter((event) => new Date(event.date).getTime() > now)
        .sort(
          (first, second) =>
            new Date(first.date).getTime() - new Date(second.date).getTime(),
        ),
      pastEvents: visibleEvents
        .filter((event) => new Date(event.date).getTime() <= now)
        .sort(
          (first, second) =>
            new Date(second.date).getTime() - new Date(first.date).getTime(),
        ),
    };
  }, [visibleEvents]);

  return (
    <div className="app-shell">
      <AppHeader />

      <main>
        <section className="discovery" id="discover" aria-labelledby="events-title">
          <div className="section-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Learn together</p>
                <h2 id="events-title">Discover events</h2>
              </div>
              <Link className="text-link" to="/events/create">
                Create your own
              </Link>
            </div>

            <EventFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {isLoading ? (
              <div className="empty-state" role="status">
                <h3>Gathering events…</h3>
                <p>Your next learning experience is almost here.</p>
              </div>
            ) : loadError ? (
              <div className="empty-state" role="alert">
                <h3>We couldn&apos;t reach the event list</h3>
                <p>{loadError}</p>
              </div>
            ) : visibleEvents.length > 0 ? (
              <div className="event-feed">
                {upcomingEvents.length > 0 ? (
                  <section className="event-feed-group" aria-labelledby="upcoming-events-title">
                    <div className="event-feed-heading">
                      <div>
                        <p className="eyebrow">Coming up</p>
                        <h3 id="upcoming-events-title">Upcoming events</h3>
                      </div>
                      <span>{upcomingEvents.length}</span>
                    </div>
                    <div className="event-grid">
                      {upcomingEvents.map((event) => (
                        <EventCard event={event} key={event.id} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {pastEvents.length > 0 ? (
                  <section
                    className="event-feed-group event-feed-past"
                    aria-labelledby="past-events-title"
                  >
                    <div className="event-feed-heading">
                      <div>
                        <p className="eyebrow">Event archive</p>
                        <h3 id="past-events-title">Past events</h3>
                      </div>
                      <span>{pastEvents.length}</span>
                    </div>
                    <div className="event-grid">
                      {pastEvents.map((event) => (
                        <EventCard event={event} key={event.id} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">
                <h3>{events.length ? 'No events found' : 'The calendar is open'}</h3>
                <p>
                  {events.length
                    ? 'Try another search or explore a different category.'
                    : 'Be the first to bring a learning event to the community.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="organizer-banner section-container">
          <div>
            <p className="eyebrow">Have something to teach?</p>
            <h2>Bring curious people together.</h2>
            <p>
              Create an EduMeet event and share your knowledge with learners in
              your community.
            </p>
          </div>
          <Link className="button button-cream" to="/events/create">
            Create an event
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-container footer-inner">
          <p>© 2026 EduMeet</p>
          <p>Knowledge has a place.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
