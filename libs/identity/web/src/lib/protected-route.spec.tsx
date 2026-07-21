import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HttpClientError } from '@smart-citizen/shared-http-client';
import { vi } from 'vitest';

import type { IdentityClient } from './identity-client';
import { IdentityProvider } from './identity-provider';
import { ProtectedRoute } from './protected-route';

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
  positions: [],
  roles: [],
  permissions: [],
};

function renderProtected(getSession: IdentityClient['getSession']) {
  const client: IdentityClient = {
    getSession,
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <IdentityProvider client={client}>
        <MemoryRouter
          future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
          initialEntries={['/private']}
        >
          <Routes>
            <Route path="/sign-in" element={<h1>Sign in route</h1>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/private" element={<h1>Private workspace</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </IdentityProvider>
    </QueryClientProvider>,
  );
}

describe('ProtectedRoute', () => {
  it('renders the protected outlet after the session resolves', async () => {
    renderProtected(vi.fn().mockResolvedValue(session));

    expect(await screen.findByRole('heading', { name: 'Private workspace' })).toBeVisible();
  });

  it('redirects an unauthorised session to Sign In', async () => {
    renderProtected(
      vi.fn().mockRejectedValue(
        new HttpClientError('Unauthorised', {
          status: 401,
          code: undefined,
          responseData: undefined,
          isNetworkError: false,
        }),
      ),
    );

    expect(await screen.findByRole('heading', { name: 'Sign in route' })).toBeVisible();
  });

  it('offers a retry for a recoverable session failure', async () => {
    const user = userEvent.setup();
    const getSession = vi
      .fn()
      .mockRejectedValueOnce(new Error('network detail'))
      .mockResolvedValue(session);
    renderProtected(getSession);

    expect(await screen.findByText('The workspace could not be loaded.')).toBeVisible();
    expect(screen.queryByText('network detail')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Private workspace' })).toBeVisible();
    expect(getSession).toHaveBeenCalledTimes(2);
  });
});
