/**
 * Task 4.2 (zap-security-remediation): E2E でフロント・バック間の API 呼び出しが正常に動作することを確認する
 * ブラウザからバックエンド API へリクエストし、CORS 許可リスト適用後も成功することを検証する。
 * @see .kiro/specs/zap-security-remediation/tasks.md 4.2, Requirements 7.1
 */
import { test, expect } from '@playwright/test';
import { getE2EBaseUrl, getE2EApiUrl } from './fixtures/test-data';

test.describe('フロント・バック間 API 呼び出し（CORS 検証）', () => {
  test('ブラウザからバックエンド API へ GET が成功する（CORS 許可リスト適用後）', async ({
    page,
  }) => {
    const baseUrl = getE2EBaseUrl();
    test.skip(!baseUrl, 'E2E_BASE_URL 未設定のためスキップ');

    const apiUrl = getE2EApiUrl(baseUrl);
    await page.goto(baseUrl);

    const result = await page.evaluate(async (rootUrl: string) => {
      const res = await fetch(rootUrl, { method: 'GET' });
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, body };
    }, `${apiUrl}/`);

    expect(result.ok, 'API への GET が成功すること（CORS でブロックされないこと）').toBe(true);
    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('message');
  });
});
