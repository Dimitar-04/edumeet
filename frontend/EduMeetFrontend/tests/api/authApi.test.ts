import type { AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AccountType } from '../../src/types/user/auth';
import type { AuthenticationResponse } from '../../src/types/user/responses';
import { registerUser } from '../../src/api/authApi';
import axiosInstance from '../../src/api/axiosInstance';

describe('registerUser', () => {
  it('sends the registration as multipart FormData', async () => {
    const image = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const post = vi.spyOn(axiosInstance, 'post').mockResolvedValue({
      data: {
          user: {
            id: 'f91d2583-d8c4-4d91-8f41-e472c9300f1e',
            userName: 'student',
            email: 'student@example.com',
            phoneNumber: null,
            accountType: AccountType.Individual,
            imageUrl: null,
            individual: {
              id: 'de21e140-ad74-4a9d-a830-563aa1631f90',
              firstName: 'Test',
              lastName: 'Student',
            },
            organization: null,
          },
          accessTokenExpiresAtUtc: '2026-09-12T12:15:00Z',
      },
    } as AxiosResponse<AuthenticationResponse>);

    const user = await registerUser({
      userName: 'student',
      email: 'student@example.com',
      phoneNumber: null,
      image,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      accountType: AccountType.Individual,
      individual: { firstName: 'Test', lastName: 'Student' },
      organization: null,
    });

    expect(user.userName).toBe('student');
    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith('/auth/register', expect.any(FormData));
    const sentForm = post.mock.calls[0][1] as FormData;
    expect(sentForm.get('UserName')).toBe('student');
    expect(sentForm.get('AccountType')).toBe('1');
    expect(sentForm.get('Individual.FirstName')).toBe('Test');
    expect(sentForm.get('Individual.LastName')).toBe('Student');
    const receivedImage = sentForm.get('image');
    expect(receivedImage).toBeInstanceOf(File);
    expect((receivedImage as File).name).toBe('avatar.png');
  });
});
