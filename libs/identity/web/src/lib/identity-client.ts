import {
  sessionContextSchema,
  type SessionContext,
  type SignInInput,
} from '@smart-citizen/identity-contracts';
import type { HttpClient } from '@smart-citizen/shared-http-client';

export interface IdentityClient {
  getSession(signal?: AbortSignal): Promise<SessionContext>;
  signIn(input: SignInInput): Promise<SessionContext>;
  signOut(): Promise<void>;
}

export function createIdentityClient(httpClient: HttpClient): IdentityClient {
  return {
    async getSession(signal) {
      const response = await httpClient.get<SessionContext>('/identity/session', {
        ...(signal ? { signal } : {}),
      });
      return sessionContextSchema.parse(response.data);
    },
    async signIn(input) {
      const response = await httpClient.post<SessionContext>('/identity/session', input);
      return sessionContextSchema.parse(response.data);
    },
    async signOut() {
      await httpClient.delete('/identity/session');
    },
  };
}
