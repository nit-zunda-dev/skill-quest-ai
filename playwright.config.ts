import { defineConfig, devices } from '@playwright/test';

/**
 * E2Eテスト用 Playwright 設定
 * @see .kiro/specs/test-strategy-implementation/design.md (E2ETestInfrastructure)
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30 * 60 * 1000, // 30分（要件 12.6）
  expect: {
    timeout: 10_000,
  },
  use: {
    headless: !!process.env.CI,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  outputDir: 'e2e/test-results',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
