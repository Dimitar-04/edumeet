import axios from 'axios';
import type {
  RegisterRequest,
  RegisteredUserResponse,
} from '../types/user/registration';
import axiosInstance from './axiosInstance';

interface ValidationProblemDetails {
  title?: string;
  errors?: Record<string, string[]>;
}

export async function registerUser(
  request: RegisterRequest,
): Promise<RegisteredUserResponse> {
  const response = await axiosInstance.post<RegisteredUserResponse>(
    '/auth/register',
    request,
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

  return error.response?.data.title ?? 'Unable to create your account.';
}
