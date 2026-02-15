import { defineConfig, devices } from '@playwright/test';

const e2eBaseUrl = process.env.E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const useLocalServers = !!e2eBaseUrl && e2eBaseUrl.includes('localhost');

/**
 * E2Eテスト用 Playwright 設定
 * @see .kiro/specs/test-strategy-implementation/design.md (E2ETestInfrastructure)
 *
 * test:e2e:local 実行時（E2E_BASE_URL が localhost）は webServer でフロント・バックを自動起動する。
 * 既に pnpm dev 等で起動済みの場合は reuseExistingServer で再利用する。
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 4 : undefined,
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
  ...(useLocalServers && {
    webServer: [
      {
        command: 'pnpm --filter @skill-quest/frontend dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
      {
        command: 'pnpm --filter @skill-quest/backend dev',
        url: 'http://localhost:8787/',
        reuseExistingServer: !process.env.CI,
        timeout: 90_000,
      },
    ],
  }),
  projects: process.env.CI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ],
});
