/**
 * Task 8.3: E2Eテスト環境の確認（Req 9.6, 9.7, 9.8）
 * - ブラウザ環境（Chromium/Firefox/WebKit）で実行されていること
 * - ローカル: test:e2e:ui / ヘッドフルは playwright.config.ts (headless: !!process.env.CI)
 * - CI: ワークフローで CI=true のためヘッドレスで実行されること
 */
import { test, expect } from '@playwright/test';

const ALLOWED_PROJECTS = ['chromium', 'firefox', 'webkit'];

test.describe('Playwright設定の検証', () => {
  test('プロジェクトがChromium/Firefox/WebKitのいずれかで実行されている', () => {
    const projectName = test.info().project.name;
    expect(ALLOWED_PROJECTS).toContain(projectName);
  });

  test('ブラウザでページが利用可能である', async ({ page }) => {
    await page.goto('about:blank');
    expect(await page.title()).toBe('');
    expect(page.url()).toContain('about:blank');
  });
});
