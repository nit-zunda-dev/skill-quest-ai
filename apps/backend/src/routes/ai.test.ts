import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types';
import { aiRouter } from './ai';
import { Genre } from '@skill-quest/shared';
import { Difficulty, TaskType } from '@skill-quest/shared';

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/', aiRouter);
  return { app, env: mockEnv };
}

describe('ai router', () => {
  const mockEnv: Bindings = {
    DB: {} as Bindings['DB'],
    AI: {} as Bindings['AI'],
    BETTER_AUTH_SECRET: 'test-secret',
  };

  beforeEach(() => {
    mockEnv.AI = {} as Bindings['AI'];
  });

  describe('POST /generate-character', () => {
    it('returns 400 for invalid body', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', goal: '', genre: 'INVALID' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('returns 200 with CharacterProfile shape for valid body', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テスト',
          goal: '目標',
          genre: Genre.FANTASY,
        }),
      }, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toHaveProperty('name');
      expect(body).toHaveProperty('className');
      expect(body).toHaveProperty('stats');
      expect(body).toHaveProperty('prologue');
    });
  });

  describe('POST /generate-narrative', () => {
    it('returns 400 for invalid body', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: '', taskTitle: '', taskType: 'X', difficulty: 'Y' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('returns 200 with narrative and rewards for valid body', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 't1',
          taskTitle: 'タスク',
          taskType: TaskType.DAILY,
          difficulty: Difficulty.EASY,
        }),
      }, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toHaveProperty('narrative');
      expect(body).toHaveProperty('rewardXp');
      expect(body).toHaveProperty('rewardGold');
    });
  });

  describe('POST /generate-partner-message', () => {
    it('returns 400 when optional field has wrong type', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate-partner-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressSummary: 123 }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('returns 200 with message for valid body', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate-partner-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toHaveProperty('message');
      expect(typeof body.message).toBe('string');
    });
  });
});
