describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses the configured frontend API URL', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');

    const { apiClient } = await import('./http-client');

    expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api/v1');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('uses the same-origin API path when the frontend API URL is absent', async () => {
    vi.stubEnv('VITE_API_URL', '');

    const { apiClient } = await import('./http-client');

    expect(apiClient.defaults.baseURL).toBe('/api/v1');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
