import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { createHttpClient } from './http-client';
import { HttpClientError, isHttpClientError, isHttpRequestCanceled } from './http-client-error';

function responseError(config: InternalAxiosRequestConfig): AxiosError {
  const response: AxiosResponse = {
    config,
    data: { message: 'Service unavailable' },
    headers: new AxiosHeaders(),
    status: 503,
    statusText: 'Service Unavailable',
  };

  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
}

function rejectingAdapter(
  createError: (config: InternalAxiosRequestConfig) => unknown,
): AxiosAdapter {
  return async (config) => {
    throw createError(config);
  };
}

describe('HttpClientError', () => {
  it('normalizes an Axios response failure without retaining request configuration', async () => {
    const client = createHttpClient({ baseURL: 'https://api.example.test/api/v1' });
    client.defaults.adapter = rejectingAdapter(responseError);

    const error = await client.get('/communities').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpClientError);
    expect(error).toMatchObject({
      name: 'HttpClientError',
      message: 'Request failed',
      status: 503,
      code: 'ERR_BAD_RESPONSE',
      responseData: { message: 'Service unavailable' },
      isNetworkError: false,
    });
    expect(error).not.toHaveProperty('config');
    expect(error).not.toHaveProperty('request');
    expect(error).not.toHaveProperty('cause');
  });

  it('classifies an Axios failure without a response as a network error', async () => {
    const client = createHttpClient({ baseURL: 'https://api.example.test/api/v1' });
    client.defaults.adapter = rejectingAdapter(
      (config) => new AxiosError('Network Error', 'ERR_NETWORK', config),
    );

    const error = await client.get('/communities').catch((reason: unknown) => reason);

    expect(error).toMatchObject({
      status: undefined,
      code: 'ERR_NETWORK',
      responseData: undefined,
      isNetworkError: true,
    });
    expect(isHttpClientError(error)).toBe(true);
  });

  it('preserves a non-Axios failure from an adapter', async () => {
    const adapterError = new Error('Adapter failed');
    const client = createHttpClient({ baseURL: 'https://api.example.test/api/v1' });
    client.defaults.adapter = rejectingAdapter(() => adapterError);

    const error = await client.get('/communities').catch((reason: unknown) => reason);

    expect(error).toBe(adapterError);
    expect(isHttpClientError(error)).toBe(false);
  });

  it('preserves Axios cancellation for TanStack Query control flow', async () => {
    let cancellation: CanceledError<unknown> | undefined;
    const client = createHttpClient({ baseURL: 'https://api.example.test/api/v1' });
    client.defaults.adapter = rejectingAdapter((config) => {
      cancellation = new CanceledError('Request canceled', config);
      return cancellation;
    });

    const error = await client.get('/communities').catch((reason: unknown) => reason);

    expect(error).toBe(cancellation);
    expect(isHttpRequestCanceled(error)).toBe(true);
    expect(isHttpClientError(error)).toBe(false);
  });
});
