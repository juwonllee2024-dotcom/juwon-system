import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.spec.ts'],
    pool: 'threads',
    maxWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
});
