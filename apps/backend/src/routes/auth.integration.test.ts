/**
 * 認証フローの統合テスト（D1 + Better Auth）
 */
import { SELF, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

const BASE = 'https://test.invalid';
const TEST_EMAIL = 'auth-integration@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Auth Integration User';

const RESET_STATEMENTS = [
  'DELETE FROM session',
  'DELETE FROM account',
  'DELETE FROM verification',
  'DELETE FROM user',
];

async function resetDatabase() {
  for (const sql of RESET_STATEMENTS) {
    await env.DB.prepare(sql).run();
  }
}

describe('Auth flow integration', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('completes sign-up → sign-in → get-session → sign-out with D1', async () => {
    const signUpRes = await SELF.fetch(`${BASE}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      }),
    });
    expect(signUpRes.status).toBe(200);

    const signInRes = await SELF.fetch(`${BASE}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    expect(signInRes.status).toBe(200);

    const setCookie = signInRes.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();

    const sessionRes = await SELF.fetch(`${BASE}/api/auth/get-session`, {
      headers: { Cookie: setCookie ?? '' },
    });
    expect(sessionRes.status).toBe(200);

    const signOutRes = await SELF.fetch(`${BASE}/api/auth/sign-out`, {
      method: 'POST',
      headers: { Cookie: setCookie ?? '' },
    });
    expect(signOutRes.status).toBe(200);
  });
});
