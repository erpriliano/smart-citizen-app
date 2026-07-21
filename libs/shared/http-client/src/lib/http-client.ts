import axios, { type AxiosInstance } from 'axios';

import { HttpClientError, isHttpRequestCanceled } from './http-client-error';

export type HttpClient = AxiosInstance;

export type AccessTokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

export interface CreateHttpClientOptions {
  baseURL: string;
  timeoutMs?: number;
  withCredentials?: boolean;
  getAccessToken?: AccessTokenProvider;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export function createHttpClient(options: CreateHttpClientOptions): HttpClient {
  if (options.baseURL.trim().length === 0) {
    throw new Error('baseURL must not be empty');
  }

  const client = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    ...(options.withCredentials === undefined ? {} : { withCredentials: options.withCredentials }),
    headers: {
      Accept: 'application/json',
    },
  });

  if (options.getAccessToken) {
    client.interceptors.request.use(async (config) => {
      const accessToken = await options.getAccessToken?.();

      if (accessToken && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return config;
    });
  }

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (isHttpRequestCanceled(error)) {
        return Promise.reject(error);
      }

      if (!axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      return Promise.reject(
        new HttpClientError(error.message, {
          status: error.response?.status,
          code: error.code,
          responseData: error.response?.data,
          isNetworkError: error.response === undefined,
        }),
      );
    },
  );

  return client;
}
