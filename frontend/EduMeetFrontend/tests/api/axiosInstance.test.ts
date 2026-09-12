import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiBaseUrl } from '../../src/api/apiConfig';
import axiosInstance from '../../src/api/axiosInstance';
import { server } from '../support/server';

describe('axios authentication interceptor', () => {
  it('returns a normal successful response without refreshing', async () => {
    let refreshCalls = 0;
    server.use(
      http.get(`${apiBaseUrl}/test/protected`, () =>
        HttpResponse.json({ value: 'available' }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const response = await axiosInstance.get<{ value: string }>(
      '/test/protected',
    );

    expect(response.data.value).toBe('available');
    expect(refreshCalls).toBe(0);
  });

  it('refreshes once and retries an unauthorized request', async () => {
    let protectedCalls = 0;
    let refreshCalls = 0;
    server.use(
      http.get(`${apiBaseUrl}/test/protected`, () => {
        protectedCalls += 1;
        return protectedCalls === 1
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({ value: 'retried' });
      }),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const response = await axiosInstance.get<{ value: string }>(
      '/test/protected',
    );

    expect(response.data.value).toBe('retried');
    expect(protectedCalls).toBe(2);
    expect(refreshCalls).toBe(1);
  });

  it('shares one refresh between concurrent unauthorized requests', async () => {
    let refreshCompleted = false;
    let refreshCalls = 0;
    server.use(
      http.get(`${apiBaseUrl}/test/protected/:id`, () =>
        refreshCompleted
          ? HttpResponse.json({ value: 'retried' })
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, async () => {
        refreshCalls += 1;
        await delay(30);
        refreshCompleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const responses = await Promise.all([
      axiosInstance.get<{ value: string }>('/test/protected/one'),
      axiosInstance.get<{ value: string }>('/test/protected/two'),
    ]);

    expect(responses.map((response) => response.data.value)).toEqual([
      'retried',
      'retried',
    ]);
    expect(refreshCalls).toBe(1);
  });

  it('dispatches one unauthorized event when refresh fails', async () => {
    const unauthorizedListener = vi.fn();
    window.addEventListener('auth:unauthorized', unauthorizedListener);
    server.use(
      http.get(`${apiBaseUrl}/test/protected`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    await expect(
      axiosInstance.get('/test/protected'),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(unauthorizedListener).toHaveBeenCalledOnce();
    window.removeEventListener('auth:unauthorized', unauthorizedListener);
  });
});
