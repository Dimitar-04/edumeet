import axios from 'axios';
import axiosInstance from './axiosInstance';
import type {
  AttendanceCheckInRequest,
  CreateEducationalEventRequest,
  CreateReviewRequest,
  GetEducationalEventsRequest,
} from '../types/event/requests';
import { toCreateEventFormData } from '../types/event/requests';
import type {
  AttendanceCheckInResponse,
  AttendanceSummaryResponse,
  EducationalEventResponse,
  EventRegistrationResponse,
  ReviewCreatedResponse,
  ReviewDeletedResponse,
} from '../types/event/responses';

export async function getEvents(
  request: GetEducationalEventsRequest = {},
): Promise<EducationalEventResponse[]> {
  const response = await axiosInstance.get<EducationalEventResponse[]>('/events', {
    params: request,
  });
  return response.data;
}

export async function createEvent(
  request: CreateEducationalEventRequest,
): Promise<EducationalEventResponse> {
  const response = await axiosInstance.post<EducationalEventResponse>(
    '/events',
    toCreateEventFormData(request),
  );

  return response.data;
}

export async function getEventById(
  eventId: string,
): Promise<EducationalEventResponse | null> {
  try {
    const response = await axiosInstance.get<EducationalEventResponse>(
      `/events/${eventId}`,
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function toggleEventRegistration(
  eventId: string,
): Promise<EventRegistrationResponse> {
  const response = await axiosInstance.post<EventRegistrationResponse>(
    `/events/${eventId}/registrations`,
  );

  return response.data;
}

export async function createEventReview(
  eventId: string,
  request: CreateReviewRequest,
): Promise<ReviewCreatedResponse> {
  const response = await axiosInstance.post<ReviewCreatedResponse>(
    `/events/${eventId}/reviews`,
    request,
  );

  return response.data;
}

export async function deleteCurrentUserEventReview(
  eventId: string,
): Promise<ReviewDeletedResponse> {
  const response = await axiosInstance.delete<ReviewDeletedResponse>(
    `/events/${eventId}/reviews/me`,
  );

  return response.data;
}

export async function getEventAttendance(
  eventId: string,
): Promise<AttendanceSummaryResponse> {
  const response = await axiosInstance.get<AttendanceSummaryResponse>(
    `/events/${eventId}/attendance`,
  );

  return response.data;
}

export async function checkInEventParticipant(
  eventId: string,
  request: AttendanceCheckInRequest,
): Promise<AttendanceCheckInResponse> {
  const response = await axiosInstance.post<AttendanceCheckInResponse>(
    `/events/${eventId}/attendance/check-in`,
    request,
  );

  return response.data;
}
