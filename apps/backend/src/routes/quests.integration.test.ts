/**
 * Task 5.3: クエストCRUD操作の統合テスト
 * 作成・取得・更新・削除を D1 で検証。テスト前に DB リセットし、認証後に CRUD を実行。
 */
import { SELF, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { TaskType, Difficulty } from '@skill-quest/shared';

const BASE = 'https://test.invalid';
const TEST_EMAIL = 'quest-integration@example.com';
const TEST_PASSWORD = 'QuestTestPassword123!';
const TEST_NAME = 'Quest Integration User';

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

describe('Quest CRUD integration (Task 5.3)', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('creates, lists, updates, and deletes a quest with D1', async () => {
    const cookie = await getAuthCookie();
    const headers = {
      'Content-Type': 'application/json',
      Cookie: cookie,
    };

    const createBody = {
      title: 'Integration Test Quest',
      type: TaskType.DAILY,
      difficulty: Difficulty.EASY,
    };
    const createRes = await SELF.fetch(`${BASE}/api/quests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; title: string };
    expect(created.id).toBeDefined();
    expect(created.title).toBe(createBody.title);

    const listRes = await SELF.fetch(`${BASE}/api/quests`, { headers });
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as { id: string }[];
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(created.id);

    const updateRes = await SELF.fetch(`${BASE}/api/quests/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title: 'Updated Quest Title' }),
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { title: string };
    expect(updated.title).toBe('Updated Quest Title');

    const deleteRes = await SELF.fetch(`${BASE}/api/quests/${created.id}`, {
      method: 'DELETE',
      headers,
    });
    expect(deleteRes.status).toBe(204);

    const listAfterRes = await SELF.fetch(`${BASE}/api/quests`, { headers });
    expect(listAfterRes.status).toBe(200);
    const listAfter = (await listAfterRes.json()) as unknown[];
    expect(listAfter.length).toBe(0);
  });
});
