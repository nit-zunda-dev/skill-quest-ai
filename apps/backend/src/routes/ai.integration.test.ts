/**
 * Task 5.4: AIエンドポイントの統合テスト
 * Workers AI をスタブして実行し、本番AIを呼び出さない。
 */
import { SELF, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { Genre } from '@skill-quest/shared';

const BASE = 'https://test.invalid';
const TEST_EMAIL = 'ai-integration@example.com';
const TEST_PASSWORD = 'AiTestPassword123!';
const TEST_NAME = 'AI Integration User';

const RESET_STATEMENTS = [
  'DELETE FROM interaction_logs',
  'DELETE FROM user_progress',
  'DELETE FROM grimoire_entries',
  'DELETE FROM quests',
  'DELETE FROM session',
  'DELETE FROM account',
  'DELETE FROM user_character_generated',
  'DELETE FROM user_character_profile',
  'DELETE FROM ai_daily_usage',
  'DELETE FROM rate_limit_logs',
  'DELETE FROM verification',
  'DELETE FROM user',
  'DELETE FROM skills',
];

async function resetDatabase() {
  for (const sql of RESET_STATEMENTS) {
    await env.DB.prepare(sql).run();
  }
}

async function getAuthCookie(): Promise<string> {
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
  return setCookie ?? '';
}

describe('AI endpoints integration (Task 5.4)', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('returns usage and generates character with stubbed AI (no real Workers AI call)', async () => {
    const cookie = await getAuthCookie();
    const headers = { 'Content-Type': 'application/json', Cookie: cookie };

    const usageRes = await SELF.fetch(`${BASE}/api/ai/usage`, { headers });
    expect(usageRes.status).toBe(200);
    const usage = (await usageRes.json()) as {
      characterGenerated?: boolean;
      narrativeRemaining?: number;
      chatRemaining?: number;
    };
    expect(usage.characterGenerated).toBe(false);
    expect(usage.narrativeRemaining).toBe(1);
    expect(usage.chatRemaining).toBeDefined();

    const genRes = await SELF.fetch(`${BASE}/api/ai/generate-character`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'TestChar',
        goal: 'Test goal',
        genre: Genre.FANTASY,
      }),
    });
    expect(genRes.status).toBe(200);
    const profile = (await genRes.json()) as { name?: string; className?: string };
    expect(profile.name).toBeDefined();
    expect(profile.className).toBeDefined();

    const charRes = await SELF.fetch(`${BASE}/api/ai/character`, { headers });
    expect(charRes.status).toBe(200);
    const saved = (await charRes.json()) as { name?: string };
    expect(saved.name).toBe(profile.name);
  });
});
