import { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { createHttpClient } from './http-client';

function successfulAdapter(capture: (config: InternalAxiosRequestConfig) => void): AxiosAdapter {
  return async (config) => {
    capture(config);

    return {
      config,
      data: { status: 'ok' },
      headers: new AxiosHeaders(),
      status: 200,
      statusText: 'OK',
    };
  };
}

describe('createHttpClient', () => {
  it('configures the API base URL, JSON response header, and default timeout', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const client = createHttpClient({ baseURL: 'https://api.example.test/api/v1' });
    client.defaults.adapter = successfulAdapter((config) => {
      requestConfig = config;
    });

    await client.get('/communities');

    expect(client.defaults.baseURL).toBe('https://api.example.test/api/v1');
    expect(client.defaults.timeout).toBe(10_000);
    expect(requestConfig?.headers.get('Accept')).toBe('application/json');
  });

  it('rejects an empty base URL', () => {
    expect(() => createHttpClient({ baseURL: '  ' })).toThrow('baseURL must not be empty');
  });

  it('uses an explicitly configured timeout', () => {
    const client = createHttpClient({
      baseURL: 'https://api.example.test/api/v1',
      timeoutMs: 25_000,
    });

    expect(client.defaults.timeout).toBe(25_000);
  });

  it('forwards credentialed request configuration for HTTP-only sessions', () => {
    const client = createHttpClient({
      baseURL: 'https://api.example.test/api/v1',
      withCredentials: true,
    });

    expect(client.defaults.withCredentials).toBe(true);
  });

  it.each([
    ['synchronous', () => 'access-token'],
    ['asynchronous', async () => 'access-token'],
  ])('adds a bearer token from a %s token provider', async (_providerType, getAccessToken) => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const client = createHttpClient({
      baseURL: 'https://api.example.test/api/v1',
      getAccessToken,
    });
    client.defaults.adapter = successfulAdapter((config) => {
      requestConfig = config;
    });

    await client.get('/communities');

    expect(requestConfig?.headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('preserves an authorization header supplied by the request', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const client = createHttpClient({
      baseURL: 'https://api.example.test/api/v1',
      getAccessToken: () => 'default-token',
    });
    client.defaults.adapter = successfulAdapter((config) => {
      requestConfig = config;
    });

    await client.get('/communities', {
      headers: { Authorization: 'Bearer request-token', 'X-Request-Id': 'request-id' },
    });

    expect(requestConfig?.headers.get('Authorization')).toBe('Bearer request-token');
    expect(requestConfig?.headers.get('X-Request-Id')).toBe('request-id');
  });

  it('forwards an AbortSignal supplied by a TanStack Query function', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    const controller = new AbortController();
    const client = createHttpClient({ baseURL: 'https://api.example.test/api/v1' });
    client.defaults.adapter = successfulAdapter((config) => {
      requestConfig = config;
    });

    await client.get('/communities', { signal: controller.signal });

    expect(requestConfig?.signal).toBe(controller.signal);
  });
});
