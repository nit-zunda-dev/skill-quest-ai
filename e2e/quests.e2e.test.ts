/**
 * Task 6.4: クエスト操作のE2Eテスト
 * クエストの作成、編集（ステータス変更）、完了、削除の操作を検証する。
 * プレビュー環境で実行。認証済みユーザーでダッシュボードにアクセスし、クエストボードで操作する。
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, setupTestData, ensureUserHasProfile } from './fixtures/test-data';

test.describe('クエスト操作 E2E', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ログイン後にクエストボードが表示される', async ({ page }) => {
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
  });

  test('クエストを作成できる', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('クエストボード')).toBeVisible({ timeout: 15_000 });

    const taskTitle = `E2E Quest ${Date.now()}`;
    const addButton = page.getByRole('button', { name: 'タスクを追加' });
    await addButton.click();

    await page.getByPlaceholder(/タスク名を入力/).fill(taskTitle);
    await page.getByRole('button', { name: '追加', exact: true }).click();

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/To Do \(\d+\)/)).toBeVisible();
  });

  test('クエストのステータスを編集できる（todo -> in_progress -> done）', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('クエストボード')).toBeVisible({ timeout: 15_000 });

    const taskTitle = `E2E Edit Quest ${Date.now()}`;
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
    await expect(page.getByText(taskTitle)).toHaveClass(/line-through/);
  });

  test('クエストを削除できる', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('クエストボード')).toBeVisible({ timeout: 15_000 });

    const taskTitle = `E2E Delete Quest ${Date.now()}`;
    const addButton = page.getByRole('button', { name: 'タスクを追加' });
    await addButton.click();
    await page.getByPlaceholder(/タスク名を入力/).fill(taskTitle);
    await page.getByRole('button', { name: '追加', exact: true }).click();

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });

    const taskCard = page.getByText(taskTitle).locator('..').locator('..').locator('..');
    await taskCard.hover();

    const deleteButton = taskCard.getByRole('button');
    await deleteButton.click();

    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5_000 });
  });
});
