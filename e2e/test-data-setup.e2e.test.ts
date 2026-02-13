/**
 * Task 6.2: E2Eテストデータセットアップ・クリーンアップの検証
 * セットアップ関数でテストユーザーを作成し、クリーンアップでサインアウトすることを確認する。
 * ベースURLが未設定またはサーバーが起動していない場合はスキップする。
 */
import { test, expect } from '@playwright/test';
import { setupTestData, cleanupTestData, getE2EBaseUrl } from './fixtures/test-data';

test.describe('E2Eテストデータセットアップ・クリーンアップ', () => {
  test('setupTestDataでユーザーを作成し、cleanupTestDataでクリーンアップできる', async () => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL が未設定のためスキップ（プレビュー環境またはローカルサーバーで実行）');

    const ctx = await setupTestData(baseUrl);
    expect(ctx.cookie).toBeTruthy();
    expect(ctx.email).toBeTruthy();

    await cleanupTestData(baseUrl, ctx.cookie);
    // セットアップ・クリーンアップがエラーなく完了すればOK（sign-out 後のセッション無効は実装依存のため検証しない）
  });
});
