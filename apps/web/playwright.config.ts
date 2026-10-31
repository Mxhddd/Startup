import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3100' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'small-phone', use: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'pnpm start', url: 'http://localhost:3100', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
