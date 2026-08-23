import type { EventCategory } from '../../types/event/common';

const categories: Array<EventCategory | 'All'> = [
  'All',
  'Technology',
  'Design',
  'Business',
  'Science',
  'Languages',
  'Community',
];

interface EventCategoryTabsProps {
  activeCategory: EventCategory | 'All';
  onCategoryChange: (category: EventCategory | 'All') => void;
  className?: string;
  ariaLabel?: string;
}

function EventCategoryTabs({
  activeCategory,
  onCategoryChange,
  className = '',
  ariaLabel = 'Filter events by category',
}: EventCategoryTabsProps) {
  return (
    <div
      className={`category-tabs ${className}`.trim()}
      aria-label={ariaLabel}
    >
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
  );
}

export default EventCategoryTabs;
