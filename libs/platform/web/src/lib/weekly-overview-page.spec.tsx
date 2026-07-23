import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FinanceOverview } from '@smart-citizen/finance-contracts';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import type { ResidencyOverview } from '@smart-citizen/residency-contracts';
import { vi } from 'vitest';

import {
  formatWeekRange,
  WeeklyOverviewPage,
  type OverviewSectionState,
} from './weekly-overview-page';

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
  permissions: [
    'residency.record.read',
    'residency.change.read',
    'finance.report.read',
    'finance.report.approve',
  ],
};

const residencyOverview: ResidencyOverview = {
  records: { activeHouseCount: 24, occupiedHouseCount: 21, currentResidentCount: 73 },
  changes: {
    pendingCount: 2,
    recent: [
      {
        id: '3ff0d0eb-cf52-447a-bf88-b33dabcf9916',
        changeType: 'MOVE_IN',
        workflowStage: 'SUBMITTED',
        submittedDateTime: '2026-07-21T08:00:00.000Z',
        updatedDateTime: '2026-07-21T08:00:00.000Z',
      },
    ],
  },
};

const financeOverview: FinanceOverview = {
  latestReport: {
    id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    revisionNumber: 1,
    workflowStage: 'UNDER_REVIEW',
    currency: 'IDR',
    openingBalanceMinor: '9007199254740993',
    incomeTotalMinor: '3000000',
    expenseTotalMinor: '1250000',
    closingBalanceMinor: '9007199256490993',
  },
  approvalRequiredCount: 1,
};

function ready<T>(data: T): OverviewSectionState<T> {
  return { status: 'ready', data };
}

interface RenderOverviewOptions {
  finance?: OverviewSectionState<FinanceOverview> | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  residency?: OverviewSectionState<ResidencyOverview> | null;
}

function renderOverview({
  finance = ready(financeOverview),
  isRefreshing = false,
  onRefresh = vi.fn(),
  residency = ready(residencyOverview),
}: RenderOverviewOptions = {}) {
  render(
    <WeeklyOverviewPage
      finance={finance}
      isRefreshing={isRefreshing}
      now={new Date('2026-07-20T08:00:00Z')}
      onRefresh={onRefresh}
      residency={residency}
      session={session}
    />,
  );
}

describe('WeeklyOverviewPage', () => {
  it('formats the community week in Indonesian', () => {
    expect(formatWeekRange(new Date('2026-07-20T08:00:00.000Z'), 'Asia/Jakarta')).toBe(
      '20–26 Juli 2026',
    );
  });

  it('shows role-appropriate records, recent changes, and exact finance values', () => {
    renderOverview();

    expect(screen.getByRole('heading', { level: 1, name: 'Weekly overview' })).toBeVisible();
    expect(screen.getByText('20–26 Juli 2026')).toBeVisible();
    expect(screen.getByText('24')).toBeVisible();
    expect(screen.getByText('21 occupied')).toBeVisible();
    expect(screen.getByText('73 current residents')).toBeVisible();
    expect(screen.getByText('Move-in')).toBeVisible();
    expect(screen.getByText('Submitted')).toBeVisible();
    expect(screen.getByText('Under review')).toBeVisible();
    expect(screen.getByText('1–31 Juli 2026')).toBeVisible();
    expect(screen.getByText('Rp9.007.199.256.490.993')).toBeVisible();
    expect(screen.getByText('1 report awaiting approval')).toBeVisible();
    expect(document.body.textContent).not.toMatch(
      /resident name|contact phone|description|evidence/i,
    );
  });

  it('keeps one successful domain visible while the other is loading', () => {
    renderOverview({ residency: { status: 'loading' } });

    expect(screen.getByRole('region', { name: 'Residency review' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByText('Rp9.007.199.256.490.993')).toBeVisible();
  });

  it('shows an independent retry without removing the successful section', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    renderOverview({ residency: { status: 'error', retry } });

    expect(screen.getByText('Rp9.007.199.256.490.993')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry residency overview' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('renders truthful empty states for records, changes, and reports', () => {
    renderOverview({
      residency: ready({
        records: { activeHouseCount: 0, occupiedHouseCount: 0, currentResidentCount: 0 },
        changes: { pendingCount: 0, recent: [] },
      }),
      finance: ready({ latestReport: null, approvalRequiredCount: 0 }),
    });

    expect(screen.getByText('No active house or resident records yet.')).toBeVisible();
    expect(screen.getByText('No residency changes have been submitted.')).toBeVisible();
    expect(screen.getByText('No financial reports have been created.')).toBeVisible();
    expect(screen.queryByText(/awaiting approval/)).not.toBeInTheDocument();
  });

  it('omits sections that the current session is not permitted to read', () => {
    renderOverview({ residency: null, finance: null });

    expect(screen.queryByRole('region', { name: 'Community records' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Residency review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Finance review' })).not.toBeInTheDocument();
  });

  it('provides a stable accessible refresh action and pending state', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const { rerender } = render(
      <WeeklyOverviewPage
        finance={ready(financeOverview)}
        isRefreshing={false}
        now={new Date('2026-07-20T08:00:00Z')}
        onRefresh={onRefresh}
        residency={ready(residencyOverview)}
        session={session}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh weekly overview' }));
    expect(onRefresh).toHaveBeenCalledOnce();

    rerender(
      <WeeklyOverviewPage
        finance={ready(financeOverview)}
        isRefreshing
        now={new Date('2026-07-20T08:00:00Z')}
        onRefresh={onRefresh}
        residency={ready(residencyOverview)}
        session={session}
      />,
    );
    expect(screen.getByRole('button', { name: 'Refreshing weekly overview' })).toBeDisabled();
  });

  it('exposes finance failure recovery with a domain-specific accessible name', () => {
    renderOverview({ finance: { status: 'error', retry: vi.fn() } });

    const section = screen.getByRole('region', { name: 'Finance review' });
    expect(within(section).getByRole('button', { name: 'Retry finance overview' })).toBeVisible();
  });
});
