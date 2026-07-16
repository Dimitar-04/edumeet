import axios from 'axios';
import type {
  RegisterRequest,
  RegisteredUserResponse,
} from '../types/user/registration';
import type {
  AuthenticationResponse,
  LoginRequest,
} from '../types/user/auth';
import axiosInstance from './axiosInstance';

interface ValidationProblemDetails {
  title?: string;
  errors?: Record<string, string[]>;
}

export async function registerUser(
  request: RegisterRequest,
): Promise<RegisteredUserResponse> {
  const response = await axiosInstance.post<AuthenticationResponse>(
    '/auth/register',
    request,
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
