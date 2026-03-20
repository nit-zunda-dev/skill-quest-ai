/**
 * ルーティング E2E（フェーズ1: 仮トップ・ログイン・404）
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl } from './fixtures/test-data';

test.describe('ルーティング E2E', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ランディングからログインへ遷移できる', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: /ログイン/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`${baseUrl}/login`));
    await expect(page.getByRole('heading', { name: 'Skill Quest AI' })).toBeVisible();
  });

  test('未定義パスは 404', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    await page.goto(`${baseUrl}/this-path-does-not-exist`);
    await expect(page.getByTestId('not-found-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });

  test('旧 /app は /account にリダイレクトされる（未ログイン時はログインへ）', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    await page.goto(`${baseUrl}/app`);
    await expect(page).toHaveURL(new RegExp(`${baseUrl}/login`));
  });
});
