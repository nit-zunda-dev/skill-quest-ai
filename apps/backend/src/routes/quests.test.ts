import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types';
import type { AuthUser } from '../types';
import { questsRouter } from './quests';
import { Difficulty, TaskType } from '@skill-quest/shared';

type QuestVariables = { user: AuthUser };

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings; Variables: QuestVariables }>();
  app.use('*', async (c, next) => {
    c.set('user', {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    });
    await next();
  });
  app.route('/', questsRouter);
  return { app, env: mockEnv };
}

/** Drizzle D1 ドライバが bind().raw() を呼ぶため、D1 互換のモックを用意 */
function createMockD1() {
  const quests: Record<string, unknown>[] = [];
  const defaultRow = () => ({
    id: 'test-quest-id',
    skillId: null,
    title: 'Test Quest',
    scenario: null,
    difficulty: 1,
    winCondition: { type: 'DAILY' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const createBound = (sql: string) => {
    const run = async () => {
      if (sql.includes('INSERT INTO')) quests.push(defaultRow());
      if (sql.includes('DELETE FROM')) quests.pop();
      return { success: true, meta: {} };
    };
    const rowForSelect = () => {
      if (sql.includes('SELECT')) {
        if (quests.length === 0) quests.push(defaultRow());
        return quests;
      }
      return quests;
    };
    const first = async () => rowForSelect()[0] ?? null;
    const all = async () => ({ results: rowForSelect(), success: true, meta: {} });
    const raw = async () => {
      if (sql.includes('INSERT INTO')) quests.push(defaultRow());
      return rowForSelect();
    };
    return { run, first, all, raw };
  };
  return {
    prepare: (sql: string) => ({
      bind: (..._args: unknown[]) => createBound(sql),
    }),
    batch: async (statements: Array<{ run?: () => Promise<unknown> }>) => {
      const out: unknown[] = [];
      for (const stmt of statements) {
        if (typeof stmt.run === 'function') out.push(await stmt.run());
        else out.push({ success: true, meta: {} });
      }
      return out;
    },
  };
}

describe('quests router', () => {
  let mockD1: ReturnType<typeof createMockD1>;
  let mockEnv: Bindings;

  beforeEach(() => {
    mockD1 = createMockD1();
    mockEnv = {
      DB: mockD1 as unknown as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
  });

  it('GET / returns 200 and array', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/', { method: 'GET' }, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('POST / with invalid body returns 400', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', type: 'INVALID', difficulty: 'EASY' }),
    }, env);
    expect(res.status).toBe(400);
  });

  it('POST / with valid body returns 201', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Quest',
        type: TaskType.DAILY,
        difficulty: Difficulty.EASY,
      }),
    }, env);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; title: string; difficulty: string };
    expect(body).toHaveProperty('id');
    expect(body.title).toBe('Test Quest');
    expect(body.difficulty).toBe(Difficulty.EASY);
  });

  it('PUT /:id with invalid param returns 400', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/invalid-id-with-empty', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    }, env);
    expect([400, 404]).toContain(res.status);
  });

  it('DELETE /:id with non-existent id returns 404', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    }, env);
    expect(res.status).toBe(404);
  });
});
