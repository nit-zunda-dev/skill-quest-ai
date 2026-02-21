import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, AuthUser } from '../types';
import { grimoireRouter } from './grimoire';
import { createMockAuthUser, createMockAI, createMockD1ForGrimoire } from '../../../../tests/utils';
import { Genre } from '@skill-quest/shared';

const testUser = createMockAuthUser();

// サービス関数をモック
vi.mock('../services/ai-usage', async () => {
  const actual = await vi.importActual('../services/ai-usage');
  return {
    ...actual,
    getGrimoireEntries: vi.fn(),
    getDailyUsage: vi.fn(),
    getCharacterProfile: vi.fn(),
    updateCharacterProfile: vi.fn(),
    createGrimoireEntry: vi.fn(),
    recordGrimoireGeneration: vi.fn(),
    getTodayUtc: vi.fn(() => '2024-01-01'),
  };
});

vi.mock('../services/ai', () => ({
  createAiService: vi.fn(),
}));

function createTestApp(mockEnv: Bindings, user?: AuthUser) {
  const app = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
  app.use('*', async (c, next) => {
    c.set('user', user ?? testUser);
    await next();
  });
  app.route('/', grimoireRouter);
  return { app, env: mockEnv };
}

describe('grimoire router', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: createMockD1ForGrimoire() as unknown as Bindings['DB'],
      AI: createMockAI() as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    it('グリモワール一覧を返す', async () => {
      const { getGrimoireEntries } = await import('../services/ai-usage');
      const mockEntries = [
        {
          id: 'e1',
          userId: testUser.id,
          taskTitle: 'Task 1',
          narrative: 'Narrative 1',
          rewardXp: 10,
          rewardGold: 5,
          createdAt: Math.floor(Date.now() / 1000),
        },
      ];
      vi.mocked(getGrimoireEntries).mockResolvedValue(mockEntries);

      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/', { method: 'GET' }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as Array<{
        id: string;
        date: string;
        taskTitle: string;
        narrative: string;
        rewardXp: number;
        rewardGold: number;
      }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].id).toBe('e1');
      expect(body[0].taskTitle).toBe('Task 1');
    });

    it('空の配列を返す（エントリがない場合）', async () => {
      const { getGrimoireEntries } = await import('../services/ai-usage');
      vi.mocked(getGrimoireEntries).mockResolvedValue([]);

      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/', { method: 'GET' }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });
  });

  describe('POST /generate', () => {
    it.skip('グリモワール生成に成功する', async () => {
      // Drizzleのモックが複雑なため、統合テストで確認
      const {
        getDailyUsage,
        getCharacterProfile,
        createGrimoireEntry,
        recordGrimoireGeneration,
      } = await import('../services/ai-usage');
      const { createAiService } = await import('../services/ai');

      vi.mocked(getDailyUsage).mockResolvedValue({
        narrativeCount: 0,
        partnerCount: 0,
        chatCount: 0,
        grimoireCount: 0,
        goalUpdateCount: 0,
      });

      const mockProfile = {
        level: 1,
        currentXp: 0,
        nextLevelXp: 100,
        gold: 0,
        genre: Genre.FANTASY,
      };
      vi.mocked(getCharacterProfile).mockResolvedValue(mockProfile);

      const mockGrimoireResult = {
        narrative: 'Generated narrative',
        rewardXp: 10,
        rewardGold: 5,
      };
      const mockAiService = {
        generateGrimoire: vi.fn().mockResolvedValue(mockGrimoireResult),
      };
      vi.mocked(createAiService).mockReturnValue(mockAiService as any);

      const mockGrimoireEntry = {
        id: 'g1',
        userId: testUser.id,
        taskTitle: 'Today\'s Adventure: Task 1',
        narrative: 'Generated narrative',
        rewardXp: 10,
        rewardGold: 5,
        createdAt: Math.floor(Date.now() / 1000),
      };
      vi.mocked(createGrimoireEntry).mockResolvedValue(mockGrimoireEntry);
      vi.mocked(recordGrimoireGeneration).mockResolvedValue(undefined);

      mockEnv.DB = createMockD1ForGrimoire({
        completedQuests: [
          {
            id: 'q1',
            userId: testUser.id,
            title: 'Task 1',
            difficulty: 1,
            winCondition: JSON.stringify({ type: 'TODO' }),
            completedAt: new Date().toISOString(),
          },
        ],
      }) as unknown as Bindings['DB'];

      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, env);

      expect(res.status).toBe(200);
      const body = await res.json() as {
        grimoireEntry: unknown;
        profile?: unknown;
        oldProfile?: unknown;
      };
      expect(body.grimoireEntry).toBeDefined();
      expect(body.profile).toBeDefined();
    });

    it('日次制限に達している場合、429エラーを返す', async () => {
      const { getDailyUsage } = await import('../services/ai-usage');
      vi.mocked(getDailyUsage).mockResolvedValue({
        narrativeCount: 0,
        partnerCount: 0,
        chatCount: 0,
        grimoireCount: 1, // 既に1回使用済み
        goalUpdateCount: 0,
      });

      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, env);

      expect(res.status).toBe(429);
      const body = await res.json() as { error: string; message: string };
      expect(body.error).toBe('Too Many Requests');
      expect(body.message).toContain('1日1回まで');
    });

    it('完了したタスクがない場合、400エラーを返す', async () => {
      const { getDailyUsage } = await import('../services/ai-usage');
      vi.mocked(getDailyUsage).mockResolvedValue({
        narrativeCount: 0,
        partnerCount: 0,
        chatCount: 0,
        grimoireCount: 0,
        goalUpdateCount: 0,
      });

      mockEnv.DB = createMockD1ForGrimoire({
        completedQuests: [], // 完了タスクなし
      }) as unknown as Bindings['DB'];

      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, env);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string; message: string };
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('完了したタスクがありません');
    });

    it.skip('env.AIが未定義の場合はスキップする', async () => {
      // Drizzleのモックが複雑なため、統合テストで確認
      const mockEnvWithoutAI: Bindings = {
        DB: mockEnv.DB,
        AI: undefined as unknown as Bindings['AI'],
        BETTER_AUTH_SECRET: 'test-secret',
      };

      const { getDailyUsage } = await import('../services/ai-usage');
      vi.mocked(getDailyUsage).mockResolvedValue({
        narrativeCount: 0,
        partnerCount: 0,
        chatCount: 0,
        grimoireCount: 0,
        goalUpdateCount: 0,
      });

      mockEnvWithoutAI.DB = createMockD1ForGrimoire({
        completedQuests: [
          {
            id: 'q1',
            userId: testUser.id,
            title: 'Task 1',
            difficulty: 1,
            winCondition: JSON.stringify({ type: 'TODO' }),
            completedAt: new Date().toISOString(),
          },
        ],
      }) as unknown as Bindings['DB'];

      const { app, env } = createTestApp(mockEnvWithoutAI);
      // AIが未定義の場合、エラーが発生する可能性があるが、テストではスキップ条件を確認
      const res = await app.request('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, env);

      // AIが未定義の場合の動作は実装に依存するが、エラーハンドリングが適切に行われることを確認
      expect([400, 500]).toContain(res.status);
    });
  });
});
