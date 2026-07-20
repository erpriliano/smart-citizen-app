import type { HttpClient } from '@smart-citizen/shared-http-client';
import { vi } from 'vitest';

import { createIdentityClient } from './identity-client';

const session = {
  user: {
    id: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5',
    email: 'admin@example.test',
  },
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  community: {
    id: '40db0b3f-0354-4f47-96df-bac69dc711a9',
    name: 'RT 05 Taman Warga',
    slug: 'rt-05-taman-warga',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  },
  positions: [{ code: 'pak-rt', name: 'Pak RT' }],
  roles: [{ code: 'community-admin', name: 'Community Administrator' }],
  permissions: ['community.read'],
};

describe('createIdentityClient', () => {
  it('uses the session endpoints and forwards TanStack Query cancellation', async () => {
    const signal = new AbortController().signal;
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: session }),
      post: vi.fn().mockResolvedValue({ data: session }),
      delete: vi.fn().mockResolvedValue({ data: undefined }),
    } as unknown as HttpClient;
    const client = createIdentityClient(httpClient);

    await expect(client.getSession(signal)).resolves.toEqual(session);
    await expect(
      client.signIn({
        email: 'admin@example.test',
        password: 'synthetic sign in phrase',
      }),
    ).resolves.toEqual(session);
    await expect(client.signOut()).resolves.toBeUndefined();

    expect(httpClient.get).toHaveBeenCalledWith('/identity/session', { signal });
    expect(httpClient.post).toHaveBeenCalledWith('/identity/session', {
      email: 'admin@example.test',
      password: 'synthetic sign in phrase',
    });
    expect(httpClient.delete).toHaveBeenCalledWith('/identity/session');
  });
});
