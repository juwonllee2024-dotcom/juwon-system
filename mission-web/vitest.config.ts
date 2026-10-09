import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
    projects: [
      { test: { name: 'node', environment: 'node', include: ['tests/domain/**/*.test.ts', 'tests/server/**/*.test.ts'] } },
      { test: { name: 'client', environment: 'jsdom', include: ['tests/client/**/*.test.tsx'] } }
    ]
  }
});
