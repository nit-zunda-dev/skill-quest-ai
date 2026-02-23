/**
 * Task 7.3: ガチャ・獲得アイテム表示のE2E検証（任意）
 * ログイン → クエスト完了 → 獲得アイテム画面で新規取得が表示される流れを検証する。
 * Requirements: 4.2
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, setupTestData, ensureUserHasProfile } from './fixtures/test-data';

test.describe('ガチャ・獲得アイテム E2E (Task 7.3)', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ログインからクエスト完了、獲得アイテム画面で新規取得が表示される', async ({ page }) => {
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
    await expect(page.getByText('クエストボード')).toBeVisible({ timeout: 10_000 });

    const taskTitle = `E2E Gacha Quest ${Date.now()}`;
    const addButton = page.getByRole('button', { name: 'タスクを追加' });
    await addButton.click();
    await page.getByPlaceholder(/タスク名を入力/).fill(taskTitle);
    await page.getByRole('button', { name: '追加', exact: true }).click();

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });

    const taskCard = page.getByText(taskTitle).locator('..').locator('..').locator('..');
    await taskCard.click();
    await expect(page.getByText(/In Progress \(\d+\)/)).toContainText(/[1-9]/, { timeout: 5_000 });

    await taskCard.click();
    await expect(page.getByText(/Done \(\d+\)/)).toContainText(/[1-9]/, { timeout: 5_000 });

    await page.goto(`${baseUrl}/app/items`);
    await expect(page.getByRole('heading', { name: '獲得アイテム' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('まだアイテムはありません')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('ul li').filter({ has: page.locator('img') }).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
