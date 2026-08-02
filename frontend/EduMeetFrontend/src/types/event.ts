export type EventCategory =
  | 'Technology'
  | 'Design'
  | 'Business'
  | 'Science'
  | 'Languages'
  | 'Community';

export interface MockEvent {
  id: string;
  title: string;
  category: EventCategory;
  format: string;
  month: string;
  day: string;
  fullDate: string;
  time: string;
  locationName: string;
  organizer: string;
  price: string;
  artCode: string;
  visualTone: 'blue' | 'charcoal' | 'cream' | 'silver';
}
