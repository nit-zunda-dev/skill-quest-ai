/**
 * Playwright設定の検証用スモークテスト。
 * 設定で定義した3ブラウザ（Chromium/Firefox/WebKit）のいずれかで実行されることを確認する。
 */
import { test, expect } from '@playwright/test';

const ALLOWED_PROJECTS = ['chromium', 'firefox', 'webkit'];

test.describe('Playwright設定の検証', () => {
  test('プロジェクトがChromium/Firefox/WebKitのいずれかで実行されている', () => {
    const projectName = test.info().project.name;
    expect(ALLOWED_PROJECTS).toContain(projectName);
  });
});
