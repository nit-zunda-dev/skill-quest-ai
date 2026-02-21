/**
 * Task 6.6: キャラクター生成フローのE2Eテスト
 * サインアップからキャラクター生成完了までの操作を検証する。
 * プレビュー環境またはスタブされたAIレスポンスを使用。
 * @see .kiro/specs/test-strategy-implementation/design.md (Requirement 11.5, 11.6, 11.7, 11.10)
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl } from './fixtures/test-data';

test.describe('キャラクター生成フロー E2E', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('サインアップ後にGenesisのイントロが表示され、冒険を始めるで次へ進める', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `e2e-genesis-${suffix}@example.com`;
    const password = 'E2ETestPassword123!';
    const name = 'E2E Genesis User';

    await page.getByRole('button', { name: 'サインアップ' }).click();
    await page.getByLabel('名前').fill(name);
    await page.getByLabel('メール').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'サインアップ' }).click();

    await expect(page.getByRole('button', { name: '冒険を始める' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Skill Quest AI' })).toBeVisible();

    await page.getByRole('button', { name: '冒険を始める' }).click();
    await expect(page.getByRole('heading', { name: 'プロフィールの作成' })).toBeVisible({ timeout: 5_000 });
  });

  test('プロフィール作成で目標とジャンルを入力し、決定して次へでキャラクター生成を開始できる', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `e2e-genesis-${suffix}@example.com`;
    const password = 'E2ETestPassword123!';
    const name = 'E2E Genesis User';

    await page.getByRole('button', { name: 'サインアップ' }).click();
    await page.getByLabel('名前').fill(name);
    await page.getByLabel('メール').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'サインアップ' }).click();

    await expect(page.getByRole('button', { name: '冒険を始める' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: '冒険を始める' }).click();

    await expect(page.getByRole('heading', { name: 'プロフィールの作成' })).toBeVisible({ timeout: 5_000 });
    await page.getByPlaceholder('例：英語学習、ダイエット、副業など').fill('E2E目標達成');
    await page.getByRole('button', { name: 'ハイファンタジー' }).click();
    await page.getByRole('button', { name: '決定して次へ' }).click();

    await expect(page.getByText('AIが世界を構築しています...')).toBeVisible({ timeout: 5_000 });
  });

  test('サインアップからキャラクター生成完了まで進み、世界へ旅立つでダッシュボードに遷移する', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `e2e-genesis-${suffix}@example.com`;
    const password = 'E2ETestPassword123!';
    const name = 'E2E Genesis User';

    await page.getByRole('button', { name: 'サインアップ' }).click();
    await page.getByLabel('名前').fill(name);
    await page.getByLabel('メール').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'サインアップ' }).click();

    await expect(page.getByRole('button', { name: '冒険を始める' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: '冒険を始める' }).click();

    await expect(page.getByRole('heading', { name: 'プロフィールの作成' })).toBeVisible({ timeout: 5_000 });
    await page.getByPlaceholder('例：英語学習、ダイエット、副業など').fill('E2E目標達成');
    await page.getByRole('button', { name: 'ハイファンタジー' }).click();
    await page.getByRole('button', { name: '決定して次へ' }).click();

    await expect(page.getByText('AIが世界を構築しています...')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '世界へ旅立つ' })).toBeVisible({ timeout: 90_000 });

    await page.getByRole('button', { name: '世界へ旅立つ' }).click();
    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('タスクボード')).toBeVisible({ timeout: 5_000 });
  });
});
