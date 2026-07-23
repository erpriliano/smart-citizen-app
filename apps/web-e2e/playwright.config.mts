import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const e2ePort = process.env['E2E_PORT'] || '4300';
// For CI, BASE_URL may point at an already deployed application.
const baseURL = process.env['BASE_URL'] || `http://localhost:${e2ePort}`;
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  testDir: './src',
  outputDir: '../../dist/.playwright/apps/web-e2e/test-output',
  fullyParallel: true,
  retries: process.env['CI'] ? 2 : 0,
  ...(process.env['CI'] ? { workers: 1 } : {}),
  reporter: [
    [
      'html',
      {
        outputFolder: '../../dist/.playwright/apps/web-e2e/playwright-report',
        open: 'never',
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: `pnpm exec nx run web:build && cd apps/web && exec node ../../node_modules/vite/bin/vite.js preview --port=${e2ePort}`,
    url: baseURL,
    reuseExistingServer: false,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
