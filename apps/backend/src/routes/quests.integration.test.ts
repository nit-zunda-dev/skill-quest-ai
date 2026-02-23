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
  'DELETE FROM user_acquired_items',
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

describe('POST /api/quests/batch (Task 4.1)', () => {
  let batchCookie: string;
  beforeAll(async () => {
    await resetDatabase();
    batchCookie = await getAuthCookie();
  });

  it('creates multiple quests and returns created list', async () => {
    const cookie = batchCookie;
    const headers = {
      'Content-Type': 'application/json',
      Cookie: cookie,
    };
    const batchBody = {
      quests: [
        { title: 'Batch Quest 1', type: TaskType.DAILY, difficulty: Difficulty.EASY },
        { title: 'Batch Quest 2', type: TaskType.HABIT, difficulty: Difficulty.MEDIUM },
      ],
    };
    const res = await SELF.fetch(`${BASE}/api/quests/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batchBody),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string; title: string; type: string; difficulty: string }[];
    expect(Array.isArray(created)).toBe(true);
    expect(created.length).toBe(2);
    expect(created[0].id).toBeDefined();
    expect(created[0].title).toBe('Batch Quest 1');
    expect(created[1].title).toBe('Batch Quest 2');
    const listRes = await SELF.fetch(`${BASE}/api/quests`, { headers });
    const list = (await listRes.json()) as { id: string }[];
    expect(list.length).toBe(2);
  });

  it('returns 400 when quests array is empty', async () => {
    const cookie = batchCookie;
    const res = await SELF.fetch(`${BASE}/api/quests/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ quests: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an item fails createQuestSchema validation', async () => {
    const cookie = batchCookie;
    const res = await SELF.fetch(`${BASE}/api/quests/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        quests: [{ title: 'No type', difficulty: Difficulty.EASY }],
      }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 401 without authentication (Task 9.2)', async () => {
    const res = await SELF.fetch(`${BASE}/api/quests/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quests: [{ title: 'Batch Quest', type: TaskType.DAILY, difficulty: Difficulty.EASY }],
      }),
    });
    expect(res.status).toBe(401);
  });
});

/**
 * Task 7.2: ガチャ・所持一覧の統合検証 (Requirements 3.1, 3.3, 4.1, 4.3)
 * - PATCH 完了後に所持1件増える、ナラティブ完了後も1件増える → 下記 Task 5.1 / 5.2 で検証
 * - 同じクエストで再度完了しても増えない → 下記 Task 5.1 で検証
 * - 未認証で GET /api/items が 401 → 下記 it で検証
 */
describe('Task 7.2: ガチャ・所持一覧の統合検証', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('未認証で GET /api/items は 401 を返す', async () => {
    const res = await SELF.fetch(`${BASE}/api/items`);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/quests/:id/complete と PATCH /api/quests/:id/status 後のガチャ付与 (Task 5.1)', () => {
  let cookie: string;
  let headers: { 'Content-Type': string; Cookie: string };

  beforeAll(async () => {
    await resetDatabase();
    cookie = await getAuthCookie();
    headers = { 'Content-Type': 'application/json', Cookie: cookie };
  });

  it('PATCH /:id/complete 成功後に GET /api/items で所持が1件増える', async () => {
    const createRes = await SELF.fetch(`${BASE}/api/quests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Complete Gacha Quest', type: TaskType.DAILY, difficulty: Difficulty.EASY }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string };

    const itemsBefore = await SELF.fetch(`${BASE}/api/items`, { headers });
    const bodyBefore = (await itemsBefore.json()) as { items: unknown[] };
    const countBefore = bodyBefore.items.length;

    const completeRes = await SELF.fetch(`${BASE}/api/quests/${created.id}/complete`, { method: 'PATCH', headers });
    expect(completeRes.status).toBe(200);

    const itemsAfter = await SELF.fetch(`${BASE}/api/items`, { headers });
    expect(itemsAfter.status).toBe(200);
    const bodyAfter = (await itemsAfter.json()) as { items: unknown[] };
    expect(bodyAfter.items.length).toBe(countBefore + 1);
  });

  it('PATCH /:id/status で status done 成功後に GET /api/items で所持が1件増える', async () => {
    const createRes = await SELF.fetch(`${BASE}/api/quests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Status Done Gacha Quest', type: TaskType.DAILY, difficulty: Difficulty.EASY }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string };

    const itemsBefore = await SELF.fetch(`${BASE}/api/items`, { headers });
    const bodyBefore = (await itemsBefore.json()) as { items: unknown[] };
    const countBefore = bodyBefore.items.length;

    const statusRes = await SELF.fetch(`${BASE}/api/quests/${created.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'done' }),
    });
    expect(statusRes.status).toBe(200);

    const itemsAfter = await SELF.fetch(`${BASE}/api/items`, { headers });
    expect(itemsAfter.status).toBe(200);
    const bodyAfter = (await itemsAfter.json()) as { items: unknown[] };
    expect(bodyAfter.items.length).toBe(countBefore + 1);
  });

  it('同じクエストで再度完了しても所持は増えない（冪等）', async () => {
    const createRes = await SELF.fetch(`${BASE}/api/quests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Idempotent Quest', type: TaskType.DAILY, difficulty: Difficulty.EASY }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string };

    await SELF.fetch(`${BASE}/api/quests/${created.id}/complete`, { method: 'PATCH', headers });
    const itemsOnce = await SELF.fetch(`${BASE}/api/items`, { headers });
    const bodyOnce = (await itemsOnce.json()) as { items: unknown[] };
    const countAfterFirst = bodyOnce.items.length;

    await SELF.fetch(`${BASE}/api/quests/${created.id}/complete`, { method: 'PATCH', headers });
    const itemsTwice = await SELF.fetch(`${BASE}/api/items`, { headers });
    const bodyTwice = (await itemsTwice.json()) as { items: unknown[] };
    expect(bodyTwice.items.length).toBe(countAfterFirst);
  });
});

describe('ナラティブ生成完了後のガチャ付与 (Task 5.2)', () => {
  let cookie: string;
  let headers: { 'Content-Type': string; Cookie: string };

  beforeAll(async () => {
    await resetDatabase();
    cookie = await getAuthCookie();
    headers = { 'Content-Type': 'application/json', Cookie: cookie };
  });

  it('POST /api/ai/generate-narrative 成功後に GET /api/items で所持が1件増える', async () => {
    const createRes = await SELF.fetch(`${BASE}/api/quests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Narrative Gacha Quest',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; title: string };

    const itemsBefore = await SELF.fetch(`${BASE}/api/items`, { headers });
    const bodyBefore = (await itemsBefore.json()) as { items: unknown[] };
    const countBefore = bodyBefore.items.length;

    const narrativeRes = await SELF.fetch(`${BASE}/api/ai/generate-narrative`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        taskId: created.id,
        taskTitle: created.title,
        taskType: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      }),
    });
    expect(narrativeRes.status).toBe(200);

    const itemsAfter = await SELF.fetch(`${BASE}/api/items`, { headers });
    expect(itemsAfter.status).toBe(200);
    const bodyAfter = (await itemsAfter.json()) as { items: unknown[] };
    expect(bodyAfter.items.length).toBe(countBefore + 1);
  });
});
