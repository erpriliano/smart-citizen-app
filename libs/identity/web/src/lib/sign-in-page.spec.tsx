import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import type { IdentityClient } from './identity-client';
import { IdentityProvider } from './identity-provider';
import { sessionQueryKey } from './session-query';
import { SignInPage } from './sign-in-page';

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

function renderSignIn(
  signIn = vi.fn().mockResolvedValue(session),
  locationState: Record<string, unknown> = { from: '/requested-workspace' },
) {
  const client: IdentityClient = {
    getSession: vi.fn().mockResolvedValue(session),
    signIn,
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <IdentityProvider client={client}>
        <MemoryRouter
          future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
          initialEntries={[{ pathname: '/sign-in', state: locationState }]}
        >
          <Routes>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/requested-workspace" element={<h1>Requested workspace</h1>} />
          </Routes>
        </MemoryRouter>
      </IdentityProvider>
    </QueryClientProvider>,
  );

  return { queryClient, signIn };
}

describe('SignInPage', () => {
  it('labels the administrative credentials and validates before submission', async () => {
    const user = userEvent.setup();
    const { signIn } = renderSignIn();

    expect(screen.getByRole('heading', { level: 1, name: 'Smart Citizen' })).toBeVisible();
    expect(screen.getByText('Administrative workspace')).toBeVisible();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeVisible();
    expect(screen.getByText('Enter at least 8 characters.')).toBeVisible();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('populates the session cache and restores the requested route', async () => {
    const user = userEvent.setup();
    const { queryClient, signIn } = renderSignIn();

    await user.type(screen.getByLabelText('Email address'), '  ADMIN@EXAMPLE.TEST ');
    await user.type(screen.getByLabelText('Password'), 'synthetic sign in phrase');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Requested workspace' })).toBeVisible();
    expect(signIn).toHaveBeenCalledWith({
      email: 'admin@example.test',
      password: 'synthetic sign in phrase',
    });
    expect(queryClient.getQueryData(sessionQueryKey)).toEqual(session);
  });

  it('shows a safe error and keeps the entered email after a failed request', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockRejectedValue(new Error('provider detail'));
    renderSignIn(signIn);

    await user.type(screen.getByLabelText('Email address'), 'admin@example.test');
    await user.type(screen.getByLabelText('Password'), 'synthetic sign in phrase');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Sign in is unavailable. Try again.')).toBeVisible();
    expect(screen.getByLabelText('Email address')).toHaveValue('admin@example.test');
    expect(screen.queryByText('provider detail')).not.toBeInTheDocument();
  });

  it('shows only the fixed warning for a confirmed sign-out failure state', () => {
    renderSignIn(undefined, {
      signOutFailed: true,
      providerDetail: 'network axios token cookie failure',
    });

    expect(screen.getByText('Sign out could not be confirmed.')).toBeVisible();
    expect(screen.getByText('Close this browser on a shared device and try again.')).toBeVisible();
    expect(screen.queryByText(/network|axios|token|cookie/i)).not.toBeInTheDocument();
  });

  it('ignores malformed sign-out failure state', () => {
    renderSignIn(undefined, { signOutFailed: 'yes' });

    expect(screen.queryByText('Sign out could not be confirmed.')).not.toBeInTheDocument();
  });
});
