import { createHttpClient } from '@smart-citizen/shared-http-client';

const apiBaseURL = import.meta.env['VITE_API_URL']?.trim() || '/api/v1';

export const apiClient = createHttpClient({
  baseURL: apiBaseURL,
  withCredentials: true,
});
