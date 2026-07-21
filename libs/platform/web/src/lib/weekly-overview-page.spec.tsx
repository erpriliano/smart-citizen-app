import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import type { SessionContext } from '@smart-citizen/identity-contracts';

import { formatWeekRange, WeeklyOverviewPage } from './weekly-overview-page';

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

describe('WeeklyOverviewPage', () => {
  it('formats the community week in Indonesian', () => {
    expect(formatWeekRange(new Date('2026-07-20T08:00:00.000Z'), 'Asia/Jakarta')).toBe(
      '20–26 Juli 2026',
    );
  });

  it('shows real session context without invented operational data', () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<SessionBoundary />}>
            <Route index element={<WeeklyOverviewPage now={new Date('2026-07-20T08:00:00Z')} />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Weekly overview' })).toBeVisible();
    expect(screen.getByText('20–26 Juli 2026')).toBeVisible();
    expect(screen.getByText('RT 05 Taman Warga')).toBeVisible();
    expect(screen.getByText('Pak RT')).toBeVisible();
    expect(
      screen.getByText(
        'Operational summaries will appear here as residency and finance are connected.',
      ),
    ).toBeVisible();
    expect(screen.queryByText(/resident count/i)).not.toBeInTheDocument();
  });
});
