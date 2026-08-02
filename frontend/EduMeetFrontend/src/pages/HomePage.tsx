import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import AppHeader from '../components/layout/AppHeader';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import { mockEvents } from '../data/mockEvents';
import type { EventCategory } from '../types/event';

function HomePage() {
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'All'>(
    'All',
  );
  const [searchTerm, setSearchTerm] = useState('');

  const visibleEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return mockEvents.filter((event) => {
      const matchesCategory =
        activeCategory === 'All' || event.category === activeCategory;
      const matchesSearch =
        !query ||
        `${event.title} ${event.locationName} ${event.category}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

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

            <dl className="hero-stats" aria-label="EduMeet community statistics">
              <div>
                <dt>120+</dt>
                <dd>events this month</dd>
              </div>
              <div>
                <dt>38</dt>
                <dd>local organizers</dd>
              </div>
              <div>
                <dt>4.9</dt>
                <dd>average rating</dd>
              </div>
            </dl>
          </div>

          <div className="hero-feature" aria-label="Featured event">
            <div className="hero-feature-art">
              <span className="hero-feature-kicker">Featured this week</span>
              <div className="hero-orbit hero-orbit-one" />
              <div className="hero-orbit hero-orbit-two" />
              <div className="hero-feature-mark">AI</div>
            </div>
            <div className="hero-feature-details">
              <div>
                <p>Technology · Workshop</p>
                <h2>Practical AI for everyday work</h2>
              </div>
              <div className="feature-date" aria-label="August 8">
                <strong>08</strong>
                <span>AUG</span>
              </div>
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

            {visibleEvents.length > 0 ? (
              <div className="event-grid">
                {visibleEvents.map((event) => (
                  <EventCard event={event} key={event.id} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No events found</h3>
                <p>Try another search or explore a different category.</p>
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
