import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const environmentPath = resolve(__dirname, '../../.env');
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const databaseUrl = process.env['TEST_DATABASE_URL'];
if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required for API tests.');

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/api',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api',
    watch: false,
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      WEB_ORIGIN: 'http://localhost:4200',
      AUTH_SESSION_SECRET: randomBytes(32).toString('hex'),
      AUTH_SESSION_TTL_SECONDS: '3600',
      AUTH_COOKIE_SECURE: 'false',
    },
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/api',
      provider: 'v8' as const,
    },
  },
}));
