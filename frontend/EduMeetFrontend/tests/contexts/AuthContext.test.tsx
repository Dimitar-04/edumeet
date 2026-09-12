import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import axiosInstance from '../../src/api/axiosInstance';
import { apiBaseUrl } from '../../src/api/apiConfig';
import { AccountType } from '../../src/types/user/auth';
import { server } from '../support/server';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

const currentUser = {
  id: '8d66fc77-680b-45cd-a3ba-f0b14144700f',
  userName: 'student',
  email: 'student@example.com',
  phoneNumber: null,
  accountType: AccountType.Individual,
  imageUrl: null,
  individual: {
    id: 'bf278f67-d355-4bc8-b3cc-f26305d7da56',
    firstName: 'Test',
    lastName: 'Student',
  },
  organization: null,
};

function AuthProbe() {
  const { user, isAuthLoading, logout } = useAuth();

  if (isAuthLoading) return <p>Loading session</p>;

  return (
    <div>
      <p>{user ? `Signed in as ${user.userName}` : 'Guest'}</p>
      <button type="button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('restores the current user and clears it after logout', async () => {
    let logoutCalls = 0;
    server.use(
      http.get(`${apiBaseUrl}/auth/me`, () => HttpResponse.json(currentUser)),
      http.post(`${apiBaseUrl}/auth/logout`, () => {
        logoutCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(
      await screen.findByText('Signed in as student'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('Guest')).toBeInTheDocument();
    expect(logoutCalls).toBe(1);
  });

  it('clears the restored user when an access-token refresh fails', async () => {
    server.use(
      http.get(`${apiBaseUrl}/auth/me`, () => HttpResponse.json(currentUser)),
      http.get(`${apiBaseUrl}/test/protected`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    expect(
      await screen.findByText('Signed in as student'),
    ).toBeInTheDocument();

    await act(async () => {
      await axiosInstance.get('/test/protected').catch(() => undefined);
    });

    await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
  });
});
