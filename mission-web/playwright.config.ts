import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4184', trace: 'retain-on-failure' },
  webServer: {
    command: 'set MISSION_PORT=4184&& set MISSION_DB_PATH=.tmp/e2e/mission.db&& node dist/server/index.js',
    url: 'http://127.0.0.1:4184/api/health',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
