import type { AccountType } from './auth';

export interface RegisteredUserResponse {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  accountType: AccountType;
  imageUrl: string | null;
  individual: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  organization: {
    id: string;
    name: string;
    website: string | null;
  } | null;
}

export interface AuthenticationResponse {
  user: RegisteredUserResponse;
  accessTokenExpiresAtUtc: string;
}

export interface RefreshResponse {
  accessTokenExpiresAtUtc: string;
}

export interface ProfileImageResponse {
  imageUrl: string;
}

export interface ReviewResponse {
  grade: number;
  description: string;
}

export interface ProfileEventResponse {
  id: string;
  title: string;
  category: string;
  format: string;
  imageUrl: string | null;
  date: string;
  locationName: string;
  averageRating: number | null;
  ratingCount: number;
  reviews: ReviewResponse[];
}

export interface PublicUserProfileResponse {
  id: string;
  userName: string;
  accountType: AccountType;
  displayName: string;
  imageUrl: string | null;
  individual: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  organization: {
    id: string;
    name: string;
    website: string | null;
  } | null;
  organizedEvents: ProfileEventResponse[];
  attendedEventsCount: number;
  attendedEvents: ProfileEventResponse[];
}
