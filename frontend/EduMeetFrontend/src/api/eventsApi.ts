import axios from 'axios';
import axiosInstance from './axiosInstance';
import type { CreateEducationalEventRequest } from '../types/event/requests';
import { toCreateEventFormData } from '../types/event/requests';
import type {
  EducationalEventResponse,
  EventRegistrationResponse,
} from '../types/event/responses';

export async function getUpcomingEvents(): Promise<EducationalEventResponse[]> {
  const response = await axiosInstance.get<EducationalEventResponse[]>('/events');
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
