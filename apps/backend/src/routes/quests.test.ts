import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types';
import type { AuthUser } from '../types';
import { questsRouter } from './quests';
import { Difficulty, TaskType } from '@skill-quest/shared';
import { createMockD1ForQuests, createMockAuthUser } from '../../../../tests/utils';

type QuestVariables = { user: AuthUser };

/** Test-only fixture: not used for real auth */
const MOCK_AUTH_USER = createMockAuthUser({
  email: process.env.TEST_USER_EMAIL ?? 'test-user@test.invalid',
});

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings; Variables: QuestVariables }>();
  app.use('*', async (c, next) => {
    c.set('user', MOCK_AUTH_USER);
    await next();
  });
  app.route('/', questsRouter);
  return { app, env: mockEnv };
}

describe('quests router', () => {
  let mockD1: ReturnType<typeof createMockD1ForQuests>;
  let mockEnv: Bindings;

  beforeEach(() => {
    mockD1 = createMockD1ForQuests();
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
