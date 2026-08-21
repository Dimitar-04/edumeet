import axios from 'axios';
import axiosInstance from './axiosInstance';
import type {
  UpdateProfileImageRequest,
  UpdateUsernameRequest,
} from '../types/user/requests';
import type {
  AuthenticationResponse,
  ProfileImageResponse,
  PublicUserProfileResponse,
  RegisteredUserResponse,
} from '../types/user/responses';

export async function getPublicProfile(
  userId: string,
): Promise<PublicUserProfileResponse | null> {
  try {
    const response = await axiosInstance.get<PublicUserProfileResponse>(
      `/profile/${userId}`,
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
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

export async function updateUsername(
  request: UpdateUsernameRequest,
): Promise<RegisteredUserResponse> {
  const response = await axiosInstance.put<AuthenticationResponse>(
    '/profile/username',
    request,
  );

  return response.data.user;
}
