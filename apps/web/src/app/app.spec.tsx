import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import type { IdentityClient } from '@smart-citizen/identity-web';
import { HttpClientError } from '@smart-citizen/shared-http-client';
import { vi } from 'vitest';

import App from './app';

const session: SessionContext = {
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
  permissions: [],
};

const unauthorised = new HttpClientError('Request failed', {
  status: 401,
  code: undefined,
  responseData: undefined,
  isNetworkError: false,
});

function renderApp(client: IdentityClient, initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[initialEntry]}
      >
        <App identityClient={client} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('redirects an unauthenticated administrative route to Sign In', async () => {
    const client: IdentityClient = {
      getSession: vi.fn().mockRejectedValue(unauthorised),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };

    renderApp(client);

    expect(await screen.findByRole('heading', { level: 1, name: 'Smart Citizen' })).toBeVisible();
    expect(screen.getByLabelText('Email address')).toBeVisible();
  });

  it('renders the authenticated Weekly Overview with real session context', async () => {
    const client: IdentityClient = {
      getSession: vi.fn().mockResolvedValue(session),
      signIn: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    renderApp(client);

    expect(await screen.findByRole('heading', { name: 'Weekly overview' })).toBeVisible();
    expect(screen.getAllByText('RT 05 Taman Warga')).toHaveLength(2);
    expect(screen.queryByText('No community data has been configured.')).not.toBeInTheDocument();
  });

  it('registers unfinished administrative routes inside the protected workspace', async () => {
    const client: IdentityClient = {
      getSession: vi.fn().mockResolvedValue(session),
      signIn: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    renderApp(client, '/houses');

    expect(await screen.findByRole('heading', { name: 'Houses' })).toBeVisible();
    expect(screen.getByText('This page is not available yet.')).toBeVisible();
    expect(screen.getAllByText('RT 05 Taman Warga')).toHaveLength(1);
  });

  it('registers the canonical financial report workspace route', async () => {
    const client: IdentityClient = {
      getSession: vi.fn().mockResolvedValue(session),
      signIn: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    renderApp(client, '/finance/reports/83d2846d-3f85-4982-b28e-6ec19916fab9');

    expect(
      await screen.findByRole('heading', { name: 'Financial report workspace' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument();
  });

  it('keeps the public financial report route outside the administrative session boundary', async () => {
    const client: IdentityClient = {
      getSession: vi.fn().mockRejectedValue(unauthorised),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };

    renderApp(client, '/p/finance/public-report-id');

    expect(await screen.findByRole('heading', { name: 'Public financial report' })).toBeVisible();
    expect(screen.getByText('This publication is not available yet.')).toBeVisible();
    expect(client.getSession).not.toHaveBeenCalled();
    expect(screen.queryByText('RT 05 Taman Warga')).not.toBeInTheDocument();
  });

  it('restores a requested protected route after sign-in', async () => {
    const user = userEvent.setup();
    const client: IdentityClient = {
      getSession: vi.fn().mockRejectedValue(unauthorised),
      signIn: vi.fn().mockResolvedValue(session),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    renderApp(client, '/not-a-page?source=review');

    await user.type(await screen.findByLabelText('Email address'), 'admin@example.test');
    await user.type(screen.getByLabelText('Password'), 'synthetic sign in phrase');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible();
    expect(client.signIn).toHaveBeenCalledOnce();
  });
});
