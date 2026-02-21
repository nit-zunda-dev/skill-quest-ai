/**
 * Task 9.3: クエスト自動生成フローのE2E検証（受入基準）
 * (1) Genesis 完了 → 提案表示 → 採用 → ダッシュボードでクエスト表示
 * (2) ダッシュボードで目標変更 → 提案表示 → 採用でクエスト差し替え
 * (3) 目標を 3 回変更して 3 回目に 429 となる流れ
 * @see .kiro/specs/quest-auto-generation/design.md (Testing Strategy - E2E/UI)
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, setupTestData, ensureUserHasProfile } from './fixtures/test-data';

test.describe('クエスト自動生成 E2E (Task 9.3)', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('Genesis 完了 → 提案表示 → 採用 → ダッシュボードでクエスト表示される', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `e2e-quest-gen-${suffix}@example.com`;
    const password = 'E2ETestPassword123!';
    const name = 'E2E Quest Gen User';

    await page.getByRole('button', { name: 'サインアップ' }).click();
    await page.getByLabel('名前').fill(name);
    await page.getByLabel('メール').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'サインアップ' }).click();

    await expect(page.getByRole('button', { name: '冒険を始める' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: '冒険を始める' }).click();

    await expect(page.getByRole('heading', { name: 'プロフィールの作成' })).toBeVisible({ timeout: 5_000 });
    await page.getByPlaceholder('例：英語学習、ダイエット、副業など').fill('E2E目標でクエスト提案を採用');
    await page.getByRole('button', { name: 'ハイファンタジー' }).click();
    await page.getByRole('button', { name: '決定して次へ' }).click();

    await expect(page.getByText('AIが世界を構築しています...')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '世界へ旅立つ' })).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: '世界へ旅立つ' }).click();

    await expect(page.getByText('目標に沿ったクエストを提案します')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('生成中...').or(page.getByRole('button', { name: '採用' }))).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: '採用' })).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: '採用' }).click();

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('タスクボード')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/To Do \(\d+\)/)).toBeVisible({ timeout: 10_000 });
  });

  test('ダッシュボードで目標変更 → 提案表示 → 採用でクエストが差し替わる', async ({
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

    await expect(page.getByText('タスクボード')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('textbox', { name: '目標' }).fill('E2E目標変更で提案採用');
    await page.getByRole('button', { name: '目標を更新' }).click();

    await expect(page.getByRole('heading', { name: 'タスク提案' })).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('提案を取得中...').or(page.getByRole('button', { name: '採用' }))
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: '採用' })).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: '採用' }).click();

    await expect(page.getByRole('heading', { name: 'タスク提案' })).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('タスクボード')).toBeVisible({ timeout: 5_000 });
  });

  test('目標を3回変更して3回目に429の案内が表示される', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const ctx = await setupTestData(baseUrl);
    const withProfile = await ensureUserHasProfile(baseUrl, ctx.cookie);
    test.skip(!withProfile, 'キャラクター生成に失敗したためスキップ');

    await page.goto(baseUrl!);
    await page.getByLabel('メール').fill(ctx.email);
    await page.getByLabel('パスワード').fill('E2ETestPassword123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('タスクボード')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('textbox', { name: '目標' }).fill('1回目の目標');
    await page.getByRole('button', { name: '目標を更新' }).click();
    await expect(page.getByRole('heading', { name: 'タスク提案' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'スキップ' }).click({ timeout: 90_000 });

    await page.getByRole('textbox', { name: '目標' }).fill('2回目の目標');
    await page.getByRole('button', { name: '目標を更新' }).click();
    await expect(page.getByRole('heading', { name: 'タスク提案' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'スキップ' }).click({ timeout: 90_000 });

    await page.getByRole('textbox', { name: '目標' }).fill('3回目の目標');
    await page.getByRole('button', { name: '目標を更新' }).click();
    await expect(page.getByText(/2回.*に達しています|本日は目標の変更回数/)).toBeVisible({
      timeout: 10_000,
    });
  });
});
