import axios, { type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl } from "./apiConfig";

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// Separate client without the interceptor.
// This avoids refresh recursively intercepting itself.
const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<void> | null = null;

function isAuthenticationEndpoint(url?: string): boolean {
  return (
    url?.includes("/auth/login") === true ||
    url?.includes("/auth/register") === true ||
    url?.includes("/auth/refresh") === true
  );
}

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthenticationEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    refreshPromise ??= refreshClient
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });

    try {
      await refreshPromise;

      return axiosInstance(originalRequest);
    } catch {
      window.dispatchEvent(new Event("auth:unauthorized"));

      return Promise.reject(error);
    }
  },
);

export default axiosInstance;
