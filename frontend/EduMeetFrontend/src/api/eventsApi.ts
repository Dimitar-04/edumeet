import axiosInstance from './axiosInstance';
import type { CreateEducationalEventRequest } from '../types/event/requests';
import { toCreateEventFormData } from '../types/event/requests';
import type { EducationalEventResponse } from '../types/event/responses';

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
  const events = await getUpcomingEvents();
  return events.find((event) => event.id === eventId) ?? null;
}
