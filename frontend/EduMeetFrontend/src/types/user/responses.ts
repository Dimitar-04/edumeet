import type { AccountType } from './auth';
import type { EventCategory } from '../event/common';

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

export interface ProfileStatisticsResponse {
  hostedEventsCount: number;
  averageRating: number | null;
  reviewCount: number;
  favoriteCategory: EventCategory | null;
  attendedEventsCount: number;
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
  statistics: ProfileStatisticsResponse;
}
