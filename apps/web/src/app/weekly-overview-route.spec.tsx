import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FinanceOverviewClient } from '@smart-citizen/finance-web';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import type { ResidencyOverviewClient } from '@smart-citizen/residency-web';
import { Suspense } from 'react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { WeeklyOverviewRoute } from './weekly-overview-route';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const baseSession: SessionContext = {
  user: { id: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5', email: 'admin@example.test' },
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  community: {
    id: communityId,
    name: 'RT 05 Taman Warga',
    slug: 'rt-05-taman-warga',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  },
  positions: [{ code: 'pak-rt', name: 'Pak RT' }],
  roles: [{ code: 'community-admin', name: 'Community Administrator' }],
  permissions: ['residency.record.read', 'residency.change.read', 'finance.report.read'],
};

const residencyOverview = {
  records: { activeHouseCount: 24, occupiedHouseCount: 21, currentResidentCount: 73 },
  changes: { pendingCount: 0, recent: [] },
};
const financeOverview = {
  latestReport: {
    id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    revisionNumber: 1,
    workflowStage: 'UNDER_REVIEW' as const,
    currency: 'IDR',
    openingBalanceMinor: '12500000',
    incomeTotalMinor: '3000000',
    expenseTotalMinor: '1750000',
    closingBalanceMinor: '13750000',
  },
  approvalRequiredCount: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

interface RenderRouteOptions {
  financeClient?: FinanceOverviewClient;
  residencyClient?: ResidencyOverviewClient;
  session?: SessionContext;
}

function renderRoute({
  financeClient = { getOverview: vi.fn().mockResolvedValue(financeOverview) },
  residencyClient = { getOverview: vi.fn().mockResolvedValue(residencyOverview) },
  session = baseSession,
}: RenderRouteOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const SessionOutlet = () => <Outlet context={session} />;

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<SessionOutlet />}>
            <Route
              index
              element={
                <Suspense fallback={<p>Loading weekly overview</p>}>
                  <WeeklyOverviewRoute
                    financeClient={financeClient}
                    residencyClient={residencyClient}
                  />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { queryClient };
}

describe('WeeklyOverviewRoute', () => {
  it('starts both permitted community requests without waiting for either result', async () => {
    const residencyResult = deferred<typeof residencyOverview>();
    const financeResult = deferred<typeof financeOverview>();
    const residencyClient = { getOverview: vi.fn(() => residencyResult.promise) };
    const financeClient = { getOverview: vi.fn(() => financeResult.promise) };

    renderRoute({ residencyClient, financeClient });

    await waitFor(() => {
      expect(residencyClient.getOverview).toHaveBeenCalledWith(
        communityId,
        expect.any(AbortSignal),
      );
      expect(financeClient.getOverview).toHaveBeenCalledWith(communityId, expect.any(AbortSignal));
    });

    await act(async () => {
      residencyResult.resolve(residencyOverview);
      financeResult.resolve(financeOverview);
      await Promise.all([residencyResult.promise, financeResult.promise]);
    });
  });

  it('does not call clients for sections the session cannot read', async () => {
    const residencyClient = { getOverview: vi.fn() };
    const financeClient = { getOverview: vi.fn() };

    renderRoute({
      residencyClient,
      financeClient,
      session: { ...baseSession, permissions: [] },
    });

    expect(await screen.findByRole('heading', { name: 'Weekly overview' })).toBeVisible();
    expect(residencyClient.getOverview).not.toHaveBeenCalled();
    expect(financeClient.getOverview).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Residency review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Finance review' })).not.toBeInTheDocument();
  });

  it('refreshes both exact active-community summaries', async () => {
    const user = userEvent.setup();
    const residencyClient = { getOverview: vi.fn().mockResolvedValue(residencyOverview) };
    const financeClient = { getOverview: vi.fn().mockResolvedValue(financeOverview) };
    renderRoute({ residencyClient, financeClient });

    expect(await screen.findByText('24')).toBeVisible();
    expect(screen.getByText('Rp13.750.000')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Refresh weekly overview' }));

    await waitFor(() => {
      expect(residencyClient.getOverview).toHaveBeenCalledTimes(2);
      expect(financeClient.getOverview).toHaveBeenCalledTimes(2);
    });
  });

  it('keeps finance visible when residency fails', async () => {
    renderRoute({
      residencyClient: { getOverview: vi.fn().mockRejectedValue(new Error('Synthetic failure')) },
    });

    expect(await screen.findByRole('button', { name: 'Retry residency overview' })).toBeVisible();
    expect(screen.getByText('Rp13.750.000')).toBeVisible();
  });
});
