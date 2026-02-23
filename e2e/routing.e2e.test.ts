/**
 * Task 14.3: ルーティング・UX の E2E 検証（Requirements 2.1, 2.2, 2.3, 5.1）
 * ランディング → ログイン → Genesis 完了 → ダッシュボードの遷移で URL が変わり、
 * リロードで同じ画面が復元されること、および未定義パスで 404 が表示されることを検証する。
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl } from './fixtures/test-data';

test.describe('ルーティング E2E (Task 14.3)', () => {
  test.beforeEach(async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    if (baseUrl) await page.goto(baseUrl);
  });

  test('ランディング(/)からログインへ進むと URL が /login になる', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(new RegExp(`^${baseUrl}/?$`));

    await page.getByRole('button', { name: 'ログイン' }).first().click();
    await expect(page).toHaveURL(new RegExp(`${baseUrl}/login`));
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('未定義パスにアクセスすると 404 画面が表示される', async ({ page }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    await page.goto(`${baseUrl}/this-path-does-not-exist`);
    await expect(page.getByTestId('not-found-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText('ページが見つかりません')).toBeVisible();
    await expect(page.getByRole('link', { name: 'トップへ' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible();
  });

  test('サインアップ→Genesis完了→ダッシュボードで URL が変わり、リロードで同じ画面が復元される', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const email = `e2e-routing-${suffix}@example.com`;
    const password = 'E2ETestPassword123!';
    const name = 'E2E Routing User';

    await expect(page).toHaveURL(new RegExp(`^${baseUrl}/?$`));
    await page.getByRole('button', { name: 'サインアップ' }).click();
    await page.getByLabel('名前').fill(name);
    await page.getByLabel('メール').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'サインアップ' }).click();

    await expect(page.getByRole('button', { name: '冒険を始める' })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`${baseUrl}/genesis`));

    await page.getByRole('button', { name: '冒険を始める' }).click();
    await expect(page.getByRole('heading', { name: 'プロフィールの作成' })).toBeVisible({ timeout: 5_000 });
    await page.getByPlaceholder('例：英語学習、ダイエット、副業など').fill('E2E目標達成');
    await page.getByRole('button', { name: 'ハイファンタジー' }).click();
    await page.getByRole('button', { name: '決定して次へ' }).click();

    await expect(page.getByText('あなたの物語の世界を紡いでいます...')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '世界へ旅立つ' })).toBeVisible({ timeout: 90_000 });

    await page.getByRole('button', { name: '世界へ旅立つ' }).click();
    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('クエストボード')).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(new RegExp(`${baseUrl}/app`));

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${baseUrl}/app`));
    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('クエストボード')).toBeVisible({ timeout: 5_000 });
  });
});
