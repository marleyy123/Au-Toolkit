
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ios',
  timeout: 60000,
  use: {
    baseURL: 'https://au-toolkit-testing.vercel.app',
    ...devices['iPhone 13'],
    browserName: 'webkit',
    headless: false,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
