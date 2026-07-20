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
  permissions: [],
};

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    const isExpectedAnonymousSessionResponse =
      text === 'Failed to load resource: the server responded with a status of 401 (Unauthorized)';

    if (message.type() === 'error' && !isExpectedAnonymousSessionResponse) errors.push(text);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function routeSession(page: Page, authenticated: boolean) {
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
      await route.fulfill({ status: 204 });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      json: { message: 'Your session is no longer valid.' },
    });
  });
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
  await expect(page.getByLabel('Email address')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
  await expectNoHorizontalOverflow(page);
  expect(browserErrors).toEqual([]);
});

test('does not render authenticated community data below 768 pixels', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await routeSession(page, true);

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

  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Weekly overview' })).toBeVisible();
    await expect(page.getByText('RT 05 Taman Warga')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expectNoHorizontalOverflow(page);
  }

  expect(browserErrors).toEqual([]);
});

test('clears private workspace content after sign-out', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await routeSession(page, true);
  await page.goto('/');

  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByText('RT 05 Taman Warga')).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});
