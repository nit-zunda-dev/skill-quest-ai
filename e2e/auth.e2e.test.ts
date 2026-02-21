/**
 * Task 6.3: 認証フローのE2Eテスト
 * ログインからログアウトまでの一連の操作を検証する。
 * プレビュー環境または E2E_BASE_URL で実行。AI はスタブまたはプレビュー環境の AI を使用。
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, setupTestData, ensureUserHasProfile } from './fixtures/test-data';

test.describe('認証フロー E2E', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ルートでログインフォームが表示される', async ({ page }) => {
    test.skip(!getE2EBaseUrl(), 'E2E_BASE_URL 未設定のためスキップ');
    await expect(page.getByRole('heading', { name: 'Skill Quest AI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('サインアップ後はログインフォームを離れ Genesis または読み込みになる', async ({ page }) => {
    test.skip(!getE2EBaseUrl(), 'E2E_BASE_URL 未設定のためスキップ');
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

  test('ログイン後ダッシュボードでログアウトするとログイン画面に戻る', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ（スタブまたはプレビュー環境が必要）');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'ログアウト' }).click();

    await expect(page.getByRole('heading', { name: 'Skill Quest AI' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });
});
