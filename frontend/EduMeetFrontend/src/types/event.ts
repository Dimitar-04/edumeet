export type EventCategory =
  | 'Technology'
  | 'Design'
  | 'Business'
  | 'Science'
  | 'Languages'
  | 'Community';

export interface EducationalEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  format: string;
  imageUrl: string | null;
  date: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
  organizerId: string;
  organizerName: string;
  organizerImageUrl: string | null;
}
