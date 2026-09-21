import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  testIgnore: ['src/**'],
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8231',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start -- --port 8231',
    url: 'http://localhost:8231',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
