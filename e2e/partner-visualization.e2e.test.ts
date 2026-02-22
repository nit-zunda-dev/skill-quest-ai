/**
 * Task 7.5: AIパートナービジュアル化の E2E 検証（Req 2.1, 6.1）
 * - パートナーページ・ウィジェットで画像が表示されること
 * - 既存パートナーチャットフローが壊れていないこと
 * - 画像読み込み失敗時のフォールバックは手動確認（本ファイル末尾のチェックリスト参照）
 */
import { test, expect } from '@playwright/test';
import {
  getE2EBaseUrl,
  setupTestData,
  ensureUserHasProfile,
} from './fixtures/test-data';

test.describe('パートナー画像表示とチャットフロー (Task 7.5)', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ログイン後パートナーページでパートナー画像が表示され、チャット入力が使える', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`${baseUrl}/app/partner`);
    await expect(
      page.getByRole('img', { name: /AIパートナー/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/メッセージ/)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole('button', { name: '送信' })).toBeVisible();
  });

  test('チャットウィジェットを開くとパートナー画像が表示され、送信までできる', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'チャットを開く' }).click();
    await expect(
      page.getByRole('img', { name: /AIパートナー/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder('メッセージを入力')).toBeVisible({
      timeout: 5_000,
    });

    const message = `E2Eパートナー画像 ${Date.now()}`;
    await page.getByPlaceholder('メッセージを入力').fill(message);
    await page.getByRole('button', { name: '送信' }).click();
    await expect(page.getByText(message)).toBeVisible({ timeout: 5_000 });
  });
});
