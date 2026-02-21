/**
 * Task 5.4: AIエンドポイントの統合テスト
 * Workers AI をスタブして実行し、本番AIを呼び出さない。
 */
import { SELF, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { Genre, TaskType, Difficulty } from '@skill-quest/shared';

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

async function getAuthCookie(opts?: {
  email?: string;
  password?: string;
  name?: string;
}): Promise<string> {
  const email = opts?.email ?? TEST_EMAIL;
  const password = opts?.password ?? TEST_PASSWORD;
  const name = opts?.name ?? TEST_NAME;
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

describe('AI endpoints integration (Task 5.4)', () => {
  let authCookie: string;

  beforeAll(async () => {
    await resetDatabase();
    authCookie = await getAuthCookie();
  });

  it('returns usage and generates character with stubbed AI (no real Workers AI call)', async () => {
    const headers = { 'Content-Type': 'application/json', Cookie: authCookie };

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

/** Task 9.2: 提案取得・目標更新の統合テスト（認証・バリデーション・スタブAI/DB） */
describe('POST /api/ai/suggest-quests (Task 9.2)', () => {
  let authCookie: string;

  beforeAll(async () => {
    await resetDatabase();
    authCookie = await getAuthCookie({
      email: 'suggest-quests@example.com',
      password: TEST_PASSWORD,
      name: 'Suggest Quests User',
    });
  });

  it('returns 401 without authentication', async () => {
    const res = await SELF.fetch(`${BASE}/api/ai/suggest-quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: '英語力を上げる' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty goal', async () => {
    const res = await SELF.fetch(`${BASE}/api/ai/suggest-quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ goal: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 with suggestions when authenticated (stub AI)', async () => {
    const res = await SELF.fetch(`${BASE}/api/ai/suggest-quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ goal: '英語力を上げる' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { suggestions: Array<{ title: string; type: string; difficulty: string }> };
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(body.suggestions[0].title).toBeDefined();
    expect(body.suggestions[0].type).toBeDefined();
    expect(body.suggestions[0].difficulty).toBeDefined();
  });
});

describe('PATCH /api/ai/goal (Task 9.2)', () => {
  let authCookieWithCharacter: string;
  const GOAL_EMAIL = 'goal-integration@example.com';
  const GOAL_PASSWORD = 'GoalTestPassword123!';

  beforeAll(async () => {
    await resetDatabase();
    authCookieWithCharacter = await getAuthCookie({
      email: GOAL_EMAIL,
      password: GOAL_PASSWORD,
      name: 'Goal Integration User',
    });
    const headers = { 'Content-Type': 'application/json', Cookie: authCookieWithCharacter };
    const genRes = await SELF.fetch(`${BASE}/api/ai/generate-character`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'GoalChar',
        goal: '初期目標',
        genre: Genre.FANTASY,
      }),
    });
    expect(genRes.status).toBe(200);
  });

  it('returns 401 without authentication', async () => {
    const res = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: '新しい目標' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid goal (empty)', async () => {
    const res = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookieWithCharacter },
      body: JSON.stringify({ goal: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 when user has no character profile', async () => {
    const noCharCookie = await getAuthCookie({
      email: 'goal-no-profile@example.com',
      password: 'NoProfile123!',
      name: 'No Profile User',
    });
    const res = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: noCharCookie },
      body: JSON.stringify({ goal: '目標' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 200 and updates profile and deletes quests (batch with D1)', async () => {
    const headers = { 'Content-Type': 'application/json', Cookie: authCookieWithCharacter };
    const createRes = await SELF.fetch(`${BASE}/api/quests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: '消えるクエスト',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      }),
    });
    expect(createRes.status).toBe(201);

    const patchRes = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ goal: '更新後の目標' }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = (await patchRes.json()) as { ok?: boolean };
    expect(patchBody.ok).toBe(true);

    const listRes = await SELF.fetch(`${BASE}/api/quests`, { headers });
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as unknown[];
    expect(list.length).toBe(0);
  });

  it('returns 429 when goal update count is already 2 today', async () => {
    const headers = { 'Content-Type': 'application/json', Cookie: authCookieWithCharacter };
    const firstRes = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ goal: '2回目' }),
    });
    expect(firstRes.status).toBe(200);
    const secondRes = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ goal: '2回目まで' }),
    });
    expect(secondRes.status).toBe(200);
    const thirdRes = await SELF.fetch(`${BASE}/api/ai/goal`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ goal: '3回目' }),
    });
    expect(thirdRes.status).toBe(429);
    const body = (await thirdRes.json()) as { error?: string; message?: string };
    expect(body.error).toBe('Too Many Requests');
    expect(body.message).toContain('2回');
  });
});
