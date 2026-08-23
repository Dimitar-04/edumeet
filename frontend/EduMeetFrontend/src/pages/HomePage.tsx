import { useEffect, useState } from 'react';
import { getEvents } from '../api/eventsApi';
import AppHeader from '../components/layout/AppHeader';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import Pagination from '../components/common/Pagination';
import type { PagedResponse } from '../types/api/pagination';
import type { EventCategory } from '../types/event/common';
import type { EventTimeScope } from '../types/event/requests';
import type { EducationalEventResponse } from '../types/event/responses';

function HomePage() {
  const [eventPage, setEventPage] = useState<
    PagedResponse<EducationalEventResponse>
  >({
    items: [],
    pageNumber: 1,
    pageSize: 9,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'All'>(
    'All',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [eventScope, setEventScope] = useState<EventTimeScope>('Upcoming');
  const [pageNumber, setPageNumber] = useState(1);
  const [viewedAt] = useState(Date.now);
  const events = eventPage.items;

  const upcomingEvents = events.filter(
    (event) => new Date(event.date).getTime() > viewedAt,
  );
  const pastEvents = events.filter(
    (event) => new Date(event.date).getTime() <= viewedAt,
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setPageNumber(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        const loadedEvents = await getEvents({
          scope: eventScope,
          search: debouncedSearchTerm || undefined,
          category: activeCategory === 'All' ? undefined : activeCategory,
          pageNumber,
          pageSize: 10,
        });

        if (isCurrentRequest) {
          setEventPage(loadedEvents);
        }
      } catch {
        if (isCurrentRequest) {
          setLoadError('Events could not be loaded. Please try again shortly.');
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeCategory, debouncedSearchTerm, eventScope, pageNumber]);

  const handleCategoryChange = (category: EventCategory | 'All') => {
    setActiveCategory(category);
    setPageNumber(1);
  };

  const handleScopeChange = (scope: EventTimeScope) => {
    setEventScope(scope);
    setPageNumber(1);
  };

  const handlePageChange = (nextPageNumber: number) => {
    setPageNumber(nextPageNumber);
    document
      .getElementById('events-title')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <AppHeader />

      <main>
        <section
          className="discovery"
          id="discover"
          aria-labelledby="events-title"
        >
          <div className="section-container">
            <div className="section-heading">
              <div>
                <h2 id="events-title">Discover events</h2>
              </div>
            </div>

            <EventFilters
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            <div className="event-scope-toolbar">
              <div
                className="event-scope-switch"
                aria-label="Choose which events to show"
              >
                <button
                  className={eventScope === 'Upcoming' ? 'active' : ''}
                  type="button"
                  aria-pressed={eventScope === 'Upcoming'}
                  onClick={() => handleScopeChange('Upcoming')}
                >
                  Upcoming
                </button>
                <button
                  className={eventScope === 'Past' ? 'active' : ''}
                  type="button"
                  aria-pressed={eventScope === 'Past'}
                  onClick={() => handleScopeChange('Past')}
                >
                  Past
                </button>
              </div>
            </div>

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
            ) : events.length > 0 ? (
              <>
                <div className="event-feed">
                  {eventScope === 'Upcoming' ? (
                    <section
                      className="event-feed-group"
                      aria-labelledby="visible-events-title"
                    >
                      <div className="event-feed-heading">
                        <div>
                          <p className="eyebrow">Coming up</p>
                          <h3 id="visible-events-title">Upcoming events</h3>
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

                  {eventScope === 'Past' ? (
                    <section
                      className="event-feed-group event-feed-past"
                      aria-labelledby="past-events-title"
                    >
                      <div className="event-feed-heading">
                        <div>
                          <p className="eyebrow">From the archive</p>
                          <h3 id="past-events-title">Past events</h3>
                        </div>
                      </div>

                      <div className="event-grid">
                        {pastEvents.map((event) => (
                          <EventCard event={event} key={event.id} />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>

                <div className="event-pagination-footer">
                  <p>
                    Page {eventPage.pageNumber} of {eventPage.totalPages}{' '}
                    &middot; {eventPage.totalCount}{' '}
                    {eventPage.totalCount === 1 ? 'event' : 'events'}
                  </p>
                  <Pagination
                    pageNumber={eventPage.pageNumber}
                    totalPages={eventPage.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>
                  {searchTerm.trim() || activeCategory !== 'All'
                    ? 'No events found'
                    : eventScope === 'Upcoming'
                      ? 'Nothing upcoming yet'
                      : 'No past events found'}
                </h3>
                <p>
                  {searchTerm.trim() || activeCategory !== 'All'
                    ? 'Try another search or explore a different category.'
                    : eventScope === 'Upcoming'
                      ? 'Switch to past events to explore the archive.'
                      : 'Completed events will appear here.'}
                </p>
              </div>
            )}
          </div>
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
