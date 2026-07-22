import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import { vi } from 'vitest';

import { AdministrativeViewportGate } from './administrative-viewport-gate';
import { ApplicationShell } from './application-shell';
import type { NavigationKey } from './navigation';

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

function SessionBoundary() {
  return <Outlet context={session} />;
}

function SignedOutPage() {
  const location = useLocation();
  const state = location.state as { signOutFailed?: unknown } | null;

  return (
    <>
      <h1>Signed out</h1>
      <p>Sign-out failure: {state?.signOutFailed === true ? 'true' : 'false'}</p>
    </>
  );
}

function renderShell(
  enabledNavigation = new Set<NavigationKey>(['overview', 'houses']),
  signOut = vi.fn().mockResolvedValue(undefined),
) {
  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={['/']}
    >
      <Routes>
        <Route path="/sign-in" element={<SignedOutPage />} />
        <Route element={<SessionBoundary />}>
          <Route
            element={<ApplicationShell enabledNavigation={enabledNavigation} onSignOut={signOut} />}
          >
            <Route index element={<h2>Overview content</h2>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  return { signOut };
}

describe('ApplicationShell', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows community context, current navigation, and no unauthorised routes', () => {
    renderShell();

    expect(screen.getByText('RT 05 Taman Warga')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Houses' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview content' })).toBeVisible();
  });

  it('provides account context and signs out without retaining private content', async () => {
    const user = userEvent.setup();
    const { signOut } = renderShell();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));

    expect(await screen.findByText('admin@example.test')).toBeVisible();
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Signed out' })).toBeVisible();
    expect(signOut).toHaveBeenCalledOnce();
    expect(screen.queryByText('RT 05 Taman Warga')).not.toBeInTheDocument();
  });

  it('keeps the sign-out action visible and disabled while pending', async () => {
    const user = userEvent.setup();
    let resolveSignOut!: () => void;
    const signOut = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve;
        }),
    );
    renderShell(undefined, signOut);

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('menuitem', { name: 'Signing out...' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    resolveSignOut();
    expect(await screen.findByRole('heading', { name: 'Signed out' })).toBeVisible();
  });

  it('navigates with only a boolean failure state when sign out rejects', async () => {
    const user = userEvent.setup();
    const signOut = vi.fn().mockRejectedValue(new Error('network token cookie detail'));
    renderShell(undefined, signOut);

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Signed out' })).toBeVisible();
    expect(screen.getByText('Sign-out failure: true')).toBeVisible();
    expect(screen.queryByText(/network|token|cookie/i)).not.toBeInTheDocument();
  });
});

describe('AdministrativeViewportGate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not render private children below 768 pixels', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(
      <AdministrativeViewportGate>
        <p>Private resident information</p>
      </AdministrativeViewportGate>,
    );

    expect(screen.getByText('Continue on a tablet or larger screen')).toBeVisible();
    expect(screen.queryByText('Private resident information')).not.toBeInTheDocument();
  });
});
