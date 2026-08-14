import type { EventCategory } from './common';

export interface EducationalEventResponse {
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
  registeredPeopleCount: number;
  isCurrentUserRegistered: boolean;
}

export interface EventRegistrationResponse {
  eventId: string;
  isRegistered: boolean;
  registeredPeopleCount: number;
}
