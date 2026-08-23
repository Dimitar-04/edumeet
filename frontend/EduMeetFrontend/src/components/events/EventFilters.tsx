import type { EventCategory } from '../../types/event/common';
import EventCategoryTabs from './EventCategoryTabs';

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
      <EventCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />

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
