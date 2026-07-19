import axios from 'axios';

export interface HttpClientErrorOptions {
  status: number | undefined;
  code: string | undefined;
  responseData: unknown;
  isNetworkError: boolean;
}

export class HttpClientError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly responseData: unknown;
  readonly isNetworkError: boolean;

  constructor(message: string, options: HttpClientErrorOptions) {
    super(message);
    this.name = 'HttpClientError';
    this.status = options.status;
    this.code = options.code;
    this.responseData = options.responseData;
    this.isNetworkError = options.isNetworkError;
  }
}

export function isHttpClientError(error: unknown): error is HttpClientError {
  return error instanceof HttpClientError;
}

export function isHttpRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error);
}
