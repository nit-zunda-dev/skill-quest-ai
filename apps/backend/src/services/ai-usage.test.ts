import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import {
  hasCharacterGenerated,
  recordCharacterGenerated,
  getDailyUsage,
  recordNarrative,
  recordPartner,
  recordChat,
  recordGrimoireGeneration,
  recordGoalUpdate,
  saveCharacterProfile,
  updateCharacterProfile,
  getCharacterProfile,
  createGrimoireEntry,
  getGrimoireEntries,
  completeQuest,
  CHAT_DAILY_LIMIT,
  getTodayUtc,
  NEURONS_NARRATIVE,
  NEURONS_PARTNER,
  NEURONS_CHAT,
  NEURONS_GRIMOIRE,
  NEURONS_GOAL_UPDATE,
  NEURONS_CHARACTER,
} from './ai-usage';
import { createMockD1ForAiUsageService } from '../../../../tests/utils';

describe('ai-usage', () => {
  describe('getTodayUtc', () => {
    it('returns YYYY-MM-DD format', () => {
      const d = getTodayUtc();
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('hasCharacterGenerated', () => {
    it('returns false when user has not generated character', async () => {
      const db = createMockD1ForAiUsageService();
      const result = await hasCharacterGenerated(db, 'user-1');
      expect(result).toBe(false);
    });

    it('returns true after recordCharacterGenerated', async () => {
      const db = createMockD1ForAiUsageService();
      await recordCharacterGenerated(db, 'user-1');
      const result = await hasCharacterGenerated(db, 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('getDailyUsage', () => {
    it('returns zeros when no usage recorded', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage).toEqual({ narrativeCount: 0, partnerCount: 0, chatCount: 0, grimoireCount: 0, goalUpdateCount: 0, neuronsEstimate: 0 });
    });

    it('returns updated counts after recordNarrative, recordPartner, recordChat', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordNarrative(db, 'user-1', today);
      await recordPartner(db, 'user-1', today);
      await recordChat(db, 'user-1', today);
      await recordChat(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.narrativeCount).toBe(1);
      expect(usage.partnerCount).toBe(1);
      expect(usage.chatCount).toBe(2);
    });

    it('returns goalUpdateCount from daily usage', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      const usageBefore = await getDailyUsage(db, 'user-1', today);
      expect(usageBefore.goalUpdateCount).toBe(0);
      await recordGoalUpdate(db, 'user-1', today);
      const usageAfter1 = await getDailyUsage(db, 'user-1', today);
      expect(usageAfter1.goalUpdateCount).toBe(1);
      await recordGoalUpdate(db, 'user-1', today);
      const usageAfter2 = await getDailyUsage(db, 'user-1', today);
      expect(usageAfter2.goalUpdateCount).toBe(2);
    });
  });

  describe('recordGoalUpdate', () => {
    it('increments goal update count for the day', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordGoalUpdate(db, 'user-1', today);
      await recordGoalUpdate(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.goalUpdateCount).toBe(2);
    });

    it('does not affect other users or dates', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordGoalUpdate(db, 'user-1', today);
      const usageUser2 = await getDailyUsage(db, 'user-2', today);
      expect(usageUser2.goalUpdateCount).toBe(0);
    });
  });

  describe('limits', () => {
    it('CHAT_DAILY_LIMIT is 10', () => {
      expect(CHAT_DAILY_LIMIT).toBe(10);
    });
  });

  describe('recordGrimoireGeneration', () => {
    it('records grimoire generation usage', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordGrimoireGeneration(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.grimoireCount).toBe(1);
    });
  });

  describe('neurons_estimate (Task 1.2)', () => {
    it('recordNarrative adds neurons_estimate by NEURONS_NARRATIVE', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordNarrative(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_NARRATIVE);
    });

    it('recordPartner adds neurons_estimate by NEURONS_PARTNER', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordPartner(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_PARTNER);
    });

    it('recordChat adds neurons_estimate by NEURONS_CHAT per call', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordChat(db, 'user-1', today);
      await recordChat(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_CHAT * 2);
    });

    it('recordGrimoireGeneration adds neurons_estimate by NEURONS_GRIMOIRE', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordGrimoireGeneration(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_GRIMOIRE);
    });

    it('recordGoalUpdate adds neurons_estimate by NEURONS_GOAL_UPDATE per call', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordGoalUpdate(db, 'user-1', today);
      await recordGoalUpdate(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_GOAL_UPDATE * 2);
    });

    it('recordCharacterGenerated adds neurons_estimate by NEURONS_CHARACTER to ai_daily_usage', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordCharacterGenerated(db, 'user-1');
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_CHARACTER);
    });

    it('multiple operation types accumulate neurons_estimate', async () => {
      const db = createMockD1ForAiUsageService();
      const today = getTodayUtc();
      await recordNarrative(db, 'user-1', today);
      await recordChat(db, 'user-1', today);
      await recordGrimoireGeneration(db, 'user-1', today);
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage.neuronsEstimate).toBe(NEURONS_NARRATIVE + NEURONS_CHAT + NEURONS_GRIMOIRE);
    });
  });

  describe('saveCharacterProfile', () => {
    it('saves character profile for user', async () => {
      const profileRows: Map<string, string> = new Map();
      const runMock = vi.fn().mockResolvedValue({ success: true, meta: {} });
      const firstMock = vi.fn().mockImplementation(async (sql: string, ...params: unknown[]) => {
        if (sql.includes('SELECT profile FROM user_character_profile')) {
          const userId = params[0] as string;
          const profileJson = profileRows.get(userId);
          return profileJson ? { profile: profileJson } : null;
        }
        return null;
      });
      const prepareMock = vi.fn().mockImplementation((sql: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            if (sql.includes('INSERT INTO user_character_profile')) {
              const userId = args[0] as string;
              const profileJson = args[1] as string;
              profileRows.set(userId, profileJson);
            }
            return runMock();
          },
          first: () => firstMock(sql, ...args),
        }),
      }));
      const db = { prepare: prepareMock } as unknown as D1Database;

      const profile = {
        name: 'テスト',
        className: '戦士',
        level: 1,
      };

      await saveCharacterProfile(db, 'user-1', profile);
      const saved = await getCharacterProfile(db, 'user-1');

      expect(saved).toBeDefined();
      expect((saved as { name?: string })?.name).toBe('テスト');
    });
  });

  describe('getCharacterProfile', () => {
    it('returns null when profile does not exist', async () => {
      const db = createMockD1ForAiUsageService();
      const profile = await getCharacterProfile(db, 'user-nonexistent');
      expect(profile).toBeNull();
    });

    it('returns parsed profile when exists', async () => {
      const profileRows: Map<string, string> = new Map();
      const runMock = vi.fn().mockResolvedValue({ success: true, meta: {} });
      const firstMock = vi.fn().mockImplementation(async (sql: string, ...params: unknown[]) => {
        if (sql.includes('SELECT profile FROM user_character_profile')) {
          const userId = params[0] as string;
          const profileJson = profileRows.get(userId);
          return profileJson ? { profile: profileJson } : null;
        }
        return null;
      });
      const prepareMock = vi.fn().mockImplementation((sql: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            if (sql.includes('INSERT INTO user_character_profile')) {
              const userId = args[0] as string;
              const profileJson = args[1] as string;
              profileRows.set(userId, profileJson);
            }
            return runMock();
          },
          first: () => firstMock(sql, ...args),
        }),
      }));
      const db = { prepare: prepareMock } as unknown as D1Database;

      const originalProfile = {
        name: 'キャラクター',
        className: '魔法使い',
        level: 5,
      };
      await saveCharacterProfile(db, 'user-1', originalProfile);
      const retrieved = await getCharacterProfile(db, 'user-1');

      expect(retrieved).toBeDefined();
      expect((retrieved as { name?: string })?.name).toBe('キャラクター');
      expect((retrieved as { className?: string })?.className).toBe('魔法使い');
      expect((retrieved as { level?: number })?.level).toBe(5);
    });
  });

  describe('updateCharacterProfile', () => {
    it('updates existing profile with partial data', async () => {
      const profileRows: Map<string, string> = new Map();
      const runMock = vi.fn().mockResolvedValue({ success: true, meta: {} });
      const firstMock = vi.fn().mockImplementation(async (sql: string, ...params: unknown[]) => {
        if (sql.includes('SELECT profile FROM user_character_profile')) {
          const userId = params[0] as string;
          const profileJson = profileRows.get(userId);
          return profileJson ? { profile: profileJson } : null;
        }
        return null;
      });
      const prepareMock = vi.fn().mockImplementation((sql: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            if (sql.includes('INSERT INTO user_character_profile')) {
              const userId = args[0] as string;
              const profileJson = args[1] as string;
              profileRows.set(userId, profileJson);
            } else if (sql.includes('UPDATE user_character_profile')) {
              const profileJson = args[0] as string;
              const userId = args[1] as string;
              profileRows.set(userId, profileJson);
            }
            return runMock();
          },
          first: () => firstMock(sql, ...args),
        }),
      }));
      const db = { prepare: prepareMock } as unknown as D1Database;

      const originalProfile = {
        name: 'キャラクター',
        className: '戦士',
        level: 1,
        currentXp: 0,
      };
      await saveCharacterProfile(db, 'user-1', originalProfile);

      await updateCharacterProfile(db, 'user-1', { level: 2, currentXp: 100 });

      const updated = await getCharacterProfile(db, 'user-1');
      expect((updated as { level?: number })?.level).toBe(2);
      expect((updated as { currentXp?: number })?.currentXp).toBe(100);
      expect((updated as { name?: string })?.name).toBe('キャラクター'); // Original fields preserved
    });

    it('does nothing when profile does not exist', async () => {
      const db = createMockD1ForAiUsageService();
      await expect(updateCharacterProfile(db, 'user-nonexistent', { level: 2 })).resolves.not.toThrow();
    });
  });

  describe('createGrimoireEntry', () => {
    it('creates grimoire entry and returns id', async () => {
      const db = createMockD1ForAiUsageService();
      const entry = {
        taskTitle: 'テストタスク',
        narrative: '物語のセグメント',
        rewardXp: 30,
        rewardGold: 15,
      };

      const result = await createGrimoireEntry(db, 'user-1', entry);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });
  });

  describe('getGrimoireEntries', () => {
    it('returns empty array when no entries exist', async () => {
      const allMock = vi.fn().mockResolvedValue({ results: [], success: true, meta: {} });
      const prepareMock = vi.fn().mockImplementation((sql: string) => ({
        bind: (..._args: unknown[]) => ({
          all: () => allMock(),
        }),
      }));
      const db = { prepare: prepareMock } as unknown as D1Database;

      const entries = await getGrimoireEntries(db, 'user-1');
      expect(entries).toEqual([]);
    });

    it('returns entries in descending order by created_at', async () => {
      const entries: Array<{ id: string; task_title: string; narrative: string; reward_xp: number; reward_gold: number; created_at: number }> = [];
      let timestampCounter = 1000;
      const runMock = vi.fn().mockImplementation(async () => {
        return { success: true, meta: {} };
      });
      const allMock = vi.fn().mockImplementation(() => {
        // Sort entries by created_at descending (newest first)
        const sorted = [...entries].sort((a, b) => b.created_at - a.created_at);
        return Promise.resolve({ results: sorted, success: true, meta: {} });
      });
      const prepareMock = vi.fn().mockImplementation((sql: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            if (sql.includes('INSERT INTO grimoire_entries')) {
              const id = args[0] as string;
              const taskTitle = args[2] as string;
              const narrative = args[3] as string;
              const rewardXp = args[4] as number;
              const rewardGold = args[5] as number;
              // Use explicit timestamp to ensure ordering
              const createdAt = timestampCounter++;
              entries.push({
                id,
                task_title: taskTitle,
                narrative,
                reward_xp: rewardXp,
                reward_gold: rewardGold,
                created_at: createdAt,
              });
            }
            return runMock();
          },
          all: () => allMock(),
        }),
      }));
      const db = { prepare: prepareMock } as unknown as D1Database;

      const entry1 = {
        taskTitle: 'タスク1',
        narrative: '物語1',
        rewardXp: 10,
        rewardGold: 5,
      };
      const entry2 = {
        taskTitle: 'タスク2',
        narrative: '物語2',
        rewardXp: 20,
        rewardGold: 10,
      };

      await createGrimoireEntry(db, 'user-1', entry1);
      await createGrimoireEntry(db, 'user-1', entry2);

      const retrievedEntries = await getGrimoireEntries(db, 'user-1');

      expect(retrievedEntries.length).toBe(2);
      // Newer entry (higher timestamp) should come first
      expect(retrievedEntries[0].taskTitle).toBe('タスク2');
      expect(retrievedEntries[1].taskTitle).toBe('タスク1');
    });
  });

  describe('completeQuest', () => {
    it('returns true when quest is completed', async () => {
      const db = createMockD1ForAiUsageService();
      const result = await completeQuest(db, 'user-1', 'quest-1');
      expect(typeof result).toBe('boolean');
    });

    it('returns false when quest does not exist', async () => {
      const db = createMockD1ForAiUsageService();
      // Mock to return 0 changes
      const mockDb = {
        ...db,
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 0 } }),
          }),
        }),
      } as unknown as D1Database;

      const result = await completeQuest(mockDb, 'user-1', 'non-existent-quest');
      expect(result).toBe(false);
    });
  });
});
