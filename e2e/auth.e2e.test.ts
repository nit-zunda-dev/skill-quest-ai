/**
 * 認証フロー E2E（フェーズ1）
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, setupTestData } from './fixtures/test-data';

test.describe('認証フロー E2E', () => {
  test('ログインページでフォームが表示される', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    await page.goto(`${baseUrl}/login`);
    await expect(page.getByRole('heading', { name: 'Skill Quest AI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('サインアップ後にログインフォームから離れる', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    await page.goto(`${baseUrl}/login`);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `e2e-signup-${suffix}@example.com`;
    const password = 'E2ETestPassword123!';
    const name = 'E2E Signup User';

    await page.getByRole('button', { name: 'サインアップ' }).click();
    await page.getByLabel('名前').fill(name);
    await page.getByLabel('メール').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'サインアップ' }).click();

    await expect(page.getByRole('button', { name: 'ログイン' })).not.toBeVisible({ timeout: 15_000 });
  });

  test('ログイン後アカウント画面でログアウトできる', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);

    await page.goto(`${baseUrl}/login`);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('アカウント')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'ログアウト' }).click();

    await expect(page.getByRole('heading', { name: 'Skill Quest AI' })).toBeVisible({ timeout: 10_000 });
  });
});
