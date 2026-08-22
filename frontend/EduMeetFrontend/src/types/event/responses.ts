import type { EventCategory } from './common';

export interface EventReviewResponse {
  reviewerId: string;
  reviewerName: string;
  reviewerImageUrl: string | null;
  grade: number;
  description: string;
}

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
  averageRating: number | null;
  ratingCount: number;
  hasCurrentUserReviewed: boolean;
  reviews: EventReviewResponse[];
}

export interface ReviewCreatedResponse {
  eventId: string;
  review: EventReviewResponse;
  averageRating: number;
  ratingCount: number;
}

export interface ReviewDeletedResponse {
  eventId: string;
  averageRating: number | null;
  ratingCount: number;
}

export interface EventRegistrationResponse {
  eventId: string;
  isRegistered: boolean;
  registeredPeopleCount: number;
}

export interface AttendanceCheckInResponse {
  eventId: string;
  participantUserId: string;
  participantName: string;
  checkedInAtUtc: string;
  alreadyCheckedIn: boolean;
  registeredPeopleCount: number;
  attendedPeopleCount: number;
  attendanceRate: number | null;
}

export interface AttendanceParticipantResponse {
  userId: string;
  name: string;
  imageUrl: string | null;
  checkedInAtUtc: string | null;
}

export interface AttendanceSummaryResponse {
  eventId: string;
  registeredPeopleCount: number;
  attendedPeopleCount: number;
  attendanceRate: number | null;
  participants: AttendanceParticipantResponse[];
}
