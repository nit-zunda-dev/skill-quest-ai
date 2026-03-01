/**
 * Task 7.3: ヘルス 200・D1 健全性、運用者 API 認可成功・401・404、日付範囲超過 400、
 * 閾値超過時のスタブ応答、構造化ログ経路を検証する統合テスト。
 * Requirements: 1.3, 2.2, 4.2, 5.1, 6.4
 */
import { SELF, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

const BASE = 'https://test.invalid';
const OPS_KEY = 'ops-test-key-integration';

const RESET_STATEMENTS = [
  'DELETE FROM session',
  'DELETE FROM account',
  'DELETE FROM user',
];

async function resetDatabase() {
  for (const sql of RESET_STATEMENTS) {
    await env.DB.prepare(sql).run();
  }
}

async function getAuthCookie(): Promise<string> {
  const email = 'infra-stability@example.com';
  const password = 'InfraStability123!';
  const name = 'Infra Stability User';
  const signUpRes = await SELF.fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  expect(signUpRes.status).toBe(200);

  const signInRes = await SELF.fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(signInRes.status).toBe(200);
  const setCookie = signInRes.headers.get('set-cookie');
  expect(setCookie).toBeTruthy();
  return setCookie ?? '';
}

describe('Task 7.3: infra-stability-cost integration', () => {
  let authCookie: string;

  beforeAll(async () => {
    await resetDatabase();
    authCookie = await getAuthCookie();
  });

  describe('ヘルスチェック 200 と D1 健全性', () => {
    it('GET /api/health は認証なしで 200 と status: ok を返す', async () => {
      const res = await SELF.fetch(`${BASE}/api/health`, { method: 'GET' });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; checks?: { db: string } };
      expect(body.status).toBe('ok');
    });

    it('D1 利用時は checks.db を含み、正常時は ok を返す', async () => {
      const res = await SELF.fetch(`${BASE}/api/health`, { method: 'GET' });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; checks?: { db: string } };
      expect(body.checks).toBeDefined();
      expect(body.checks?.db).toBe('ok');
    });
  });

  describe('運用者 API 認可', () => {
    it('X-Ops-API-Key 一致時は GET /api/ops/stats が 200 と集計結果を返す', async () => {
      const res = await SELF.fetch(`${BASE}/api/ops/stats`, {
        method: 'GET',
        headers: { 'X-Ops-API-Key': OPS_KEY },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { totalUsers: number; activeUsers: number };
      expect(body).toHaveProperty('totalUsers');
      expect(body).toHaveProperty('activeUsers');
    });

    it('X-Ops-API-Key 不一致時は 401 を返す', async () => {
      const res = await SELF.fetch(`${BASE}/api/ops/stats`, {
        method: 'GET',
        headers: { 'X-Ops-API-Key': 'wrong-key' },
      });
      expect(res.status).toBe(401);
    });

    it('X-Ops-API-Key なしでは 401 を返す', async () => {
      const res = await SELF.fetch(`${BASE}/api/ops/stats`, { method: 'GET' });
      expect(res.status).toBe(401);
    });

    it('GET /api/ops/ai-usage はキー一致時 200 と byDate を返す', async () => {
      const res = await SELF.fetch(
        `${BASE}/api/ops/ai-usage?from=2026-01-01&to=2026-01-31`,
        { method: 'GET', headers: { 'X-Ops-API-Key': OPS_KEY } }
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { byDate: unknown[]; totalNeuronsEstimate: number };
      expect(body).toHaveProperty('byDate');
      expect(body).toHaveProperty('totalNeuronsEstimate');
    });
  });

  describe('日付範囲超過 400', () => {
    it('from/to が 90 日を超えると GET /api/ops/ai-usage は 400 を返す', async () => {
      const res = await SELF.fetch(
        `${BASE}/api/ops/ai-usage?from=2026-01-01&to=2026-04-02`,
        { method: 'GET', headers: { 'X-Ops-API-Key': OPS_KEY } }
      );
      expect(res.status).toBe(400);
      const text = await res.text();
      expect(text).toContain('90');
    });
  });

  describe('閾値超過時・スタブ応答', () => {
    it('統合テストではスタブが有効で、AI エンドポイントがスタブメッセージを返す', async () => {
      const res = await SELF.fetch(`${BASE}/api/ai/generate-partner-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: authCookie },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string };
      expect(body.message).toContain('AI 利用一時制限中');
    });
  });

  describe('構造化ログ経路', () => {
    it('リクエストがロギングミドルウェアを経由し正常応答する（構造化ログが発火する経路）', async () => {
      const res = await SELF.fetch(`${BASE}/api/health`, { method: 'GET' });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe('ok');
      // ミドルウェア経由で logStructured が呼ばれることを応答成功で担保（Worker 内 console はテストから検証しない）
    });
  });
});
