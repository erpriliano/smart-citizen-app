import { test, expect } from '@playwright/test';

test('renders the workspace shell without mobile overflow', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/workspace');

  await expect(page).toHaveTitle('Smart Citizen');
  await expect(page.getByRole('heading', { level: 1, name: 'Smart Citizen' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Workspace overview' })).toBeVisible();

  await page.reload();
  await expect(page.getByText('No community data has been configured.')).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});
