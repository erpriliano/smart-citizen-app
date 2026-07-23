import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';

import type { IdentityClient } from './identity-client';
import { IdentityProvider } from './identity-provider';
import { sessionQueryKey, useSignOutMutation } from './session-query';

const privateQueryKeys = [
  sessionQueryKey,
  ['residency', 'community-id', 'overview'],
  ['finance', 'community-id', 'overview'],
  ['private', 'unrelated-record'],
] as const;

function renderSignOut(signOut: IdentityClient['signOut']) {
  const client: IdentityClient = {
    getSession: vi.fn(),
    signIn: vi.fn(),
    signOut,
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  for (const queryKey of privateQueryKeys) {
    queryClient.setQueryData(queryKey, { private: true });
  }
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider client={client}>{children}</IdentityProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useSignOutMutation(), { wrapper });

  return { ...hook, queryClient };
}

describe('useSignOutMutation', () => {
  it('removes every private query after a successful sign out', async () => {
    const { result, queryClient } = renderSignOut(vi.fn().mockResolvedValue(undefined));

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('removes every private query when sign out cannot be confirmed', async () => {
    const { result, queryClient } = renderSignOut(
      vi.fn().mockRejectedValue(new Error('network token cookie provider detail')),
    );

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow();
    });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
