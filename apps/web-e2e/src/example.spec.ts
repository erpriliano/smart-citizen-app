import { expect, test, type Page } from '@playwright/test';

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
  permissions: [
    'residency.record.read',
    'residency.change.read',
    'finance.report.read',
    'finance.report.approve',
  ],
};

const residencyOverview = {
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

const financeOverview = {
  latestReport: {
    id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    revisionNumber: 1,
    workflowStage: 'UNDER_REVIEW',
    currency: 'IDR',
    openingBalanceMinor: '12500000',
    incomeTotalMinor: '3000000',
    expenseTotalMinor: '1750000',
    closingBalanceMinor: '13750000',
  },
  approvalRequiredCount: 1,
};

function collectBrowserErrors(page: Page, expectedHttpStatuses: number[] = []): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    const isExpectedAnonymousSessionResponse =
      text === 'Failed to load resource: the server responded with a status of 401 (Unauthorized)';
    const isExpectedHttpFailure = expectedHttpStatuses.some((status) =>
      text.includes(`status of ${status}`),
    );

    if (
      message.type() === 'error' &&
      !isExpectedAnonymousSessionResponse &&
      !isExpectedHttpFailure
    ) {
      errors.push(text);
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function routeSession(page: Page, authenticated: boolean, deleteStatus = 204) {
  await page.route('**/api/v1/identity/session', async (route) => {
    const method = route.request().method();

    if (method === 'GET' && authenticated) {
      await route.fulfill({ status: 200, contentType: 'application/json', json: session });
      return;
    }

    if (method === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', json: session });
      return;
    }

    if (method === 'DELETE') {
      await route.fulfill({
        status: deleteStatus,
        ...(deleteStatus === 204
          ? {}
          : { contentType: 'application/json', json: { message: 'Generic failure' } }),
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      json: { message: 'Your session is no longer valid.' },
    });
  });
}

interface OverviewRouteOptions {
  financeStatus?: 200 | 500;
  residencyStatus?: 200 | 500;
}

async function routeOverviews(
  page: Page,
  { financeStatus = 200, residencyStatus = 200 }: OverviewRouteOptions = {},
) {
  const requests = { finance: 0, residency: 0 };

  await page.route(
    `**/api/v1/communities/${session.community.id}/residency/overview`,
    async (route) => {
      requests.residency += 1;
      await route.fulfill({
        status: residencyStatus,
        contentType: 'application/json',
        json:
          residencyStatus === 200 ? residencyOverview : { message: 'Synthetic residency failure' },
      });
    },
  );
  await page.route(
    `**/api/v1/communities/${session.community.id}/finance/overview`,
    async (route) => {
      requests.finance += 1;
      await route.fulfill({
        status: financeStatus,
        contentType: 'application/json',
        json: financeStatus === 200 ? financeOverview : { message: 'Synthetic finance failure' },
      });
    },
  );

  return requests;
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

test('keeps Sign In usable and keyboard accessible at 375 pixels', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await routeSession(page, false);

  await page.goto('/review?week=current');

  await expect(page).toHaveTitle('Smart Citizen');
  await expect(page.getByRole('heading', { level: 1, name: 'Smart Citizen' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email address')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
  const signInButtonBox = await page.getByRole('button', { name: 'Sign in' }).boundingBox();
  expect(signInButtonBox?.width).toBeGreaterThan(250);
  expect(signInButtonBox?.height).toBeGreaterThanOrEqual(40);
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test('does not render authenticated community data below 768 pixels', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await routeSession(page, true);
  await routeOverviews(page);

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Continue on a tablet or larger screen' }),
  ).toBeVisible();
  await expect(page.getByText('RT 05 Taman Warga')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test('renders the authenticated workspace at tablet and desktop widths', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await routeSession(page, true);
  await routeOverviews(page);

  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Weekly overview' })).toBeVisible();
    await expect(page.getByText('RT 05 Taman Warga', { exact: true })).toBeVisible();
    await expect(page.getByText('24')).toBeVisible();
    await expect(page.getByText('21 occupied')).toBeVisible();
    await expect(page.getByText('73 current residents')).toBeVisible();
    await expect(page.getByText('Move-in')).toBeVisible();
    await expect(page.getByText('Rp13.750.000')).toBeVisible();
    await expect(page.getByText('1 report awaiting approval')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const sidebarBox = await page.locator('aside').boundingBox();
    expect(sidebarBox?.width).toBe(viewport.width === 1440 ? 248 : 80);
    await expectNoHorizontalOverflow(page);
  }

  expect(browserErrors).toEqual([]);
});

test('refreshes both active-community summaries', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await routeSession(page, true);
  const requests = await routeOverviews(page);
  await page.goto('/');

  await expect(page.getByText('Rp13.750.000')).toBeVisible();
  await expect.poll(() => requests.residency).toBeGreaterThan(0);
  await expect.poll(() => requests.finance).toBeGreaterThan(0);
  const residencyBeforeRefresh = requests.residency;
  const financeBeforeRefresh = requests.finance;
  await page.getByRole('button', { name: 'Refresh weekly overview' }).click();
  await expect.poll(() => requests.residency).toBeGreaterThan(residencyBeforeRefresh);
  await expect.poll(() => requests.finance).toBeGreaterThan(financeBeforeRefresh);
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test('keeps finance visible and residency retry keyboard-operable after partial failure', async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page, [500]);
  await page.setViewportSize({ width: 768, height: 1024 });
  await routeSession(page, true);
  const requests = await routeOverviews(page, { residencyStatus: 500 });
  await page.goto('/');

  await expect(page.getByText('Rp13.750.000')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Retry residency overview' });
  await expect(retry).toBeVisible();
  const residencyBeforeRetry = requests.residency;
  await retry.focus();
  await expect(retry).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => requests.residency).toBeGreaterThan(residencyBeforeRetry);
  await expect(page.getByText('Rp13.750.000')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test('clears private workspace content after sign-out', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await routeSession(page, true);
  await routeOverviews(page);
  await page.goto('/');

  await expect(page.getByText('Rp13.750.000')).toBeVisible();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByText('RT 05 Taman Warga')).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});

test('shows only the generic warning when sign-out cannot be confirmed', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page, [500]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await routeSession(page, true, 500);
  await routeOverviews(page);
  await page.goto('/');

  await expect(page.getByText('Rp13.750.000')).toBeVisible();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page.getByText('Sign out could not be confirmed.')).toBeVisible();
  await expect(
    page.getByText('Close this browser on a shared device and try again.'),
  ).toBeVisible();
  await expect(page.getByText('RT 05 Taman Warga')).toHaveCount(0);
  await expect(page.getByText(/network|axios|token|cookie/i)).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});
