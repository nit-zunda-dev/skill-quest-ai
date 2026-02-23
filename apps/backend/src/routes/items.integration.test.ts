/**
 * Task 4.1: GET /api/items の統合テスト
 * 認証必須・本人の所持一覧を取得時刻降順で返す。未認証は 401。
 */
import { SELF, env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { acquiredItemsResponseSchema, Category, Rarity } from '@skill-quest/shared';

const VALID_CATEGORIES = Object.values(Category);
const VALID_RARITIES = Object.values(Rarity);

const BASE = 'https://test.invalid';
const TEST_EMAIL = 'items-integration@example.com';
const TEST_PASSWORD = 'ItemsTestPassword123!';
const TEST_NAME = 'Items Integration User';

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

describe('GET /api/items (Task 4.1)', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('未認証の場合は 401 を返す', async () => {
    const res = await SELF.fetch(`${BASE}/api/items`);
    expect(res.status).toBe(401);
  });

  it('認証済みの場合は 200 で items 配列を返す（空でもよい）', async () => {
    const cookie = await getAuthCookie();
    const res = await SELF.fetch(`${BASE}/api/items`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { items: unknown[] };
    expect(Array.isArray(json.items)).toBe(true);
    const parsed = acquiredItemsResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items).toEqual([]);
    }
  });

  it('所持が1件ある場合は itemId, acquiredAt, name, category, rarity を含む', async () => {
    const cookie = await getAuthCookie();
    const userRes = await SELF.fetch(`${BASE}/api/auth/get-session`, { headers: { Cookie: cookie } });
    const session = (await userRes.json()) as { user?: { id: string } };
    const userId = session.user?.id;
    expect(userId).toBeDefined();

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      `INSERT INTO user_acquired_items (id, user_id, item_id, quest_id, acquired_at) VALUES (?, ?, ?, ?, ?)`
    )
      .bind('test-acquired-1', userId, 'drink-common-01', null, now)
      .run();

    const res = await SELF.fetch(`${BASE}/api/items`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { items: { itemId: string; acquiredAt: string; name: string; category: string; rarity: string }[] };
    const parsed = acquiredItemsResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items.length).toBeGreaterThanOrEqual(1);
      const first = parsed.data.items.find((i) => i.itemId === 'drink-common-01');
      expect(first).toBeDefined();
      expect(first!.itemId).toBe('drink-common-01');
      expect(first!.name).toBeDefined();
      expect(first!.acquiredAt).toBeDefined();
      expect(VALID_CATEGORIES).toContain(first!.category);
      expect(VALID_RARITIES).toContain(first!.rarity);
    }
  });
});
