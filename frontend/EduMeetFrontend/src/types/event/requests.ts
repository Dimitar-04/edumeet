import type { EventCategory } from './common';

export interface CreateEducationalEventRequest {
  title: string;
  description: string;
  category: EventCategory;
  format: string;
  image: File | null;
  date: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
}

export function toCreateEventFormData(
  request: CreateEducationalEventRequest,
): FormData {
  const formData = new FormData();

  formData.append('title', request.title);
  formData.append('description', request.description);
  formData.append('category', request.category);
  formData.append('format', request.format);
  formData.append('date', request.date);
  formData.append('locationName', request.locationName);
  formData.append('address', request.address);
  formData.append('latitude', String(request.latitude));
  formData.append('longitude', String(request.longitude));

  if (request.googlePlaceId) {
    formData.append('googlePlaceId', request.googlePlaceId);
  }

  if (request.image) {
    formData.append('image', request.image);
  }

  return formData;
}
