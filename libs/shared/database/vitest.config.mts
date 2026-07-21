/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/database',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'shared-database',
    watch: false,
    environment: 'node',
    globals: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/shared/database',
      provider: 'v8' as const,
    },
  },
}));
