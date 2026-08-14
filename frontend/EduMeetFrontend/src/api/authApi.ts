import axios from 'axios';
import type {
  RegisterRequest,
  LoginRequest,
  UpdateProfileImageRequest,
} from '../types/user/requests';
import type {
  AuthenticationResponse,
  ProfileImageResponse,
  RefreshResponse,
  RegisteredUserResponse,
} from '../types/user/responses';
import type { ValidationProblemDetails } from '../types/api/errors';
import { AccountType } from '../types/user/auth';
import axiosInstance from './axiosInstance';

export async function registerUser(
  request: RegisterRequest,
): Promise<RegisteredUserResponse> {
  const formData = new FormData();

  formData.append('UserName', request.userName);
  formData.append('Email', request.email);
  formData.append('Password', request.password);
  formData.append('ConfirmPassword', request.confirmPassword);
  formData.append('AccountType', String(request.accountType));

  if (request.phoneNumber) {
    formData.append('PhoneNumber', request.phoneNumber);
  }

  if (request.image) {
    formData.append('image', request.image);
  }

  if (request.accountType === AccountType.Individual) {
    formData.append('Individual.FirstName', request.individual.firstName);
    formData.append('Individual.LastName', request.individual.lastName);
  } else {
    formData.append('Organization.Name', request.organization.name);

    if (request.organization.website) {
      formData.append('Organization.Website', request.organization.website);
    }
  }

  const response = await axiosInstance.post<AuthenticationResponse>(
    '/auth/register',
    formData,
  );

  return response.data.user;
}

export async function loginUser(
  request: LoginRequest,
): Promise<RegisteredUserResponse> {
  const response = await axiosInstance.post<AuthenticationResponse>(
    '/auth/login',
    request,
  );

  return response.data.user;
}

export async function logoutUser(): Promise<void> {
  await axiosInstance.post('/auth/logout');
}

export async function getCurrentUser(): Promise<RegisteredUserResponse> {
  const response = await axiosInstance.get<RegisteredUserResponse>('/auth/me');

  return response.data;
}

export async function refreshAccessToken(): Promise<RefreshResponse> {
  const response = await axiosInstance.post<RefreshResponse>('/auth/refresh');

  return response.data;
}

export async function updateProfileImage(
  request: UpdateProfileImageRequest,
): Promise<ProfileImageResponse> {
  const formData = new FormData();
  formData.append('image', request.image);

  const response = await axiosInstance.put<ProfileImageResponse>(
    '/profile/image',
    formData,
  );

  return response.data;
}

export function getAuthErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ValidationProblemDetails>(error)) {
    return 'Something went wrong. Please try again.';
  }

  const errors = error.response?.data.errors;

  if (errors) {
    const firstMessage = Object.values(errors).flat()[0];

    if (firstMessage) {
      return firstMessage;
    }
  }

  return error.response?.data.title ?? 'Unable to authenticate.';
}
