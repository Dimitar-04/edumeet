import type { EventCategory } from '../../types/event';

const categories: Array<EventCategory | 'All'> = [
  'All',
  'Technology',
  'Design',
  'Business',
  'Science',
  'Languages',
  'Community',
];

interface EventFiltersProps {
  activeCategory: EventCategory | 'All';
  onCategoryChange: (category: EventCategory | 'All') => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

function EventFilters({
  activeCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
}: EventFiltersProps) {
  return (
    <div className="event-filters">
      <div className="category-tabs" aria-label="Filter events by category">
        {categories.map((category) => (
          <button
            className={activeCategory === category ? 'active' : ''}
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <label className="event-search">
        <span className="visually-hidden">Search events</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search events"
        />
      </label>
    </div>
  );
}

export default EventFilters;
