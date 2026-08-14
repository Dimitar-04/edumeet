import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getUpcomingEvents } from '../api/eventsApi';
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
        setEvents(await getUpcomingEvents());
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

  return (
    <div className="app-shell">
      <AppHeader />

      <main>
        <section className="discovery" id="discover" aria-labelledby="events-title">
          <div className="section-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Upcoming near you</p>
                <h2 id="events-title">Discover something new</h2>
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
              <div className="event-grid">
                {visibleEvents.map((event) => (
                  <EventCard event={event} key={event.id} />
                ))}
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
