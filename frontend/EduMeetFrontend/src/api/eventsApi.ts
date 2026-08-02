import axiosInstance from './axiosInstance';
import type { EducationalEvent } from '../types/event';

export async function getUpcomingEvents(): Promise<EducationalEvent[]> {
  const response = await axiosInstance.get<EducationalEvent[]>('/events');
  return response.data;
}

export async function createEvent(
  formData: FormData,
): Promise<EducationalEvent> {
  const response = await axiosInstance.post<EducationalEvent>(
    '/events',
    formData,
  );

  return response.data;
}
