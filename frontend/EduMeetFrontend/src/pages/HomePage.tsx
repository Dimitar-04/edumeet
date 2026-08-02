import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getUpcomingEvents } from '../api/eventsApi';
import AppHeader from '../components/layout/AppHeader';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import type { EducationalEvent, EventCategory } from '../types/event';

function HomePage() {
  const [events, setEvents] = useState<EducationalEvent[]>([]);
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

  const featuredEvent = events[0];
  const featuredDate = featuredEvent ? new Date(featuredEvent.date) : null;
  const organizerCount = new Set(events.map((event) => event.organizerId)).size;

  return (
    <div className="app-shell">
      <AppHeader />

      <main>
        <section className="hero section-container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Learn nearby. Grow together.</p>
            <h1 id="hero-title">
              Find your next <span>learning experience.</span>
            </h1>
            <p className="hero-description">
              Discover workshops, talks, and hands-on events led by educators
              and organizations in your community.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#discover">
                Explore events
              </a>
              <Link className="button button-secondary" to="/events/create">
                Host an event
              </Link>
            </div>

            <dl className="hero-stats" aria-label="EduMeet event statistics">
              <div>
                <dt>{events.length}</dt>
                <dd>upcoming events</dd>
              </div>
              <div>
                <dt>{organizerCount}</dt>
                <dd>active organizers</dd>
              </div>
              <div>
                <dt>6</dt>
                <dd>learning categories</dd>
              </div>
            </dl>
          </div>

          <div className="hero-feature" aria-label="Next upcoming event">
            <div className="hero-feature-art">
              <span className="hero-feature-kicker">
                {featuredEvent ? 'Up next' : 'Your community, your classroom'}
              </span>
              <div className="hero-orbit hero-orbit-one" />
              <div className="hero-orbit hero-orbit-two" />
              <div className="hero-feature-mark">
                {featuredEvent
                  ? featuredEvent.title
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word.charAt(0))
                      .join('')
                      .toUpperCase()
                  : 'EM'}
              </div>
            </div>
            <div className="hero-feature-details">
              <div>
                <p>
                  {featuredEvent
                    ? `${featuredEvent.category} · ${featuredEvent.format}`
                    : 'Create the first event'}
                </p>
                <h2>
                  {featuredEvent?.title ?? 'Share what you know with EduMeet'}
                </h2>
              </div>
              {featuredDate ? (
                <div
                  className="feature-date"
                  aria-label={featuredDate.toLocaleDateString('en', {
                    dateStyle: 'long',
                  })}
                >
                  <strong>
                    {featuredDate.toLocaleDateString('en', { day: '2-digit' })}
                  </strong>
                  <span>
                    {featuredDate.toLocaleDateString('en', { month: 'short' })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </section>

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
