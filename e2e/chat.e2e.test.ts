/**
 * Task 6.5: AIチャット機能のE2Eテスト
 * チャット入力からストリーミングレスポンス表示までの操作を検証する。
 * プレビュー環境またはスタブされたAIレスポンスを使用。
 * @see .kiro/specs/test-strategy-implementation/design.md (Requirement 11.4, 11.6, 11.7, 11.10)
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, setupTestData, ensureUserHasProfile } from './fixtures/test-data';

test.describe('AIチャット機能 E2E', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ログイン後にチャットウィジェットを開き、メッセージ入力欄が表示される', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'チャットを開く' }).click();
    await expect(page.getByPlaceholder('メッセージを入力')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '送信' })).toBeVisible();
  });

  test('チャットに入力して送信すると、ストリーミングレスポンスが表示される', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'チャットを開く' }).click();
    await expect(page.getByPlaceholder('メッセージを入力')).toBeVisible({ timeout: 5_000 });

    const message = `E2Eチャットテスト ${Date.now()}`;
    await page.getByPlaceholder('メッセージを入力').fill(message);
    await page.getByRole('button', { name: '送信' }).click();

    await expect(page.getByText(message)).toBeVisible({ timeout: 5_000 });

    await expect(
      page.locator('div.fixed.bottom-6.right-6 .bg-slate-700').filter({ hasText: /.+/ })
    ).toBeVisible({ timeout: 60_000 });
  });
});
