import { describe, it, expect, beforeEach } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import {
  hasCharacterGenerated,
  recordCharacterGenerated,
  getDailyUsage,
  recordNarrative,
  recordPartner,
  recordChat,
  CHAT_DAILY_LIMIT,
  getTodayUtc,
} from './ai-usage';

/** テスト用 D1 互換モック（user_character_generated / ai_daily_usage 用） */
function createMockD1() {
  const characterRows: { user_id: string }[] = [];
  const usageRows: Map<string, { narrative: number; partner: number; chat: number }> = new Map();

  const run = async (sql: string, ...params: unknown[]) => {
    const key = (params[0] as string) + '-' + (params[1] as string);
    if (sql.includes('INSERT INTO user_character_generated')) {
      characterRows.push({ user_id: params[0] as string });
      return { success: true, meta: {} };
    }
    if (sql.includes('INSERT INTO ai_daily_usage')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0 };
      if (sql.includes('1, 0, 0)') && sql.includes('narrative_count')) cur.narrative = 1;
      else if (sql.includes('0, 1, 0)') && sql.includes('partner_count')) cur.partner = 1;
      else if (sql.includes('0, 0, 1)') && sql.includes('chat_count')) cur.chat = (cur.chat || 0) + 1;
      usageRows.set(key, cur);
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET narrative_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0 };
      usageRows.set(key, { ...cur, narrative: 1 });
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET partner_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0 };
      usageRows.set(key, { ...cur, partner: 1 });
      return { success: true, meta: {} };
    }
    if (sql.includes('DO UPDATE SET chat_count')) {
      const cur = usageRows.get(key) ?? { narrative: 0, partner: 0, chat: 0 };
      usageRows.set(key, { ...cur, chat: cur.chat + 1 });
      return { success: true, meta: {} };
    }
    return { success: true, meta: {} };
  };

  const first = async (sql: string, ...params: unknown[]) => {
    if (sql.includes('user_character_generated')) {
      const uid = params[0] as string;
      return characterRows.some((r) => r.user_id === uid) ? { user_id: uid } : null;
    }
    if (sql.includes('SELECT narrative_count') && sql.includes('ai_daily_usage')) {
      const key = (params[0] as string) + '-' + (params[1] as string);
      const row = usageRows.get(key);
      return row
        ? {
            narrative_count: row.narrative,
            partner_count: row.partner,
            chat_count: row.chat,
          }
        : null;
    }
    return null;
  };

  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      run: () => run(sql, ...args),
      first: () => first(sql, ...args),
    }),
  });

  return { prepare, characterRows, usageRows };
}

describe('ai-usage', () => {
  describe('getTodayUtc', () => {
    it('returns YYYY-MM-DD format', () => {
      const d = getTodayUtc();
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('hasCharacterGenerated', () => {
    it('returns false when user has not generated character', async () => {
      const mock = createMockD1();
      const db = mock as unknown as D1Database;
      const result = await hasCharacterGenerated(db, 'user-1');
      expect(result).toBe(false);
    });

    it('returns true after recordCharacterGenerated', async () => {
      const mock = createMockD1();
      const db = mock as unknown as D1Database;
      await recordCharacterGenerated(db, 'user-1');
      const result = await hasCharacterGenerated(db, 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('getDailyUsage', () => {
    it('returns zeros when no usage recorded', async () => {
      const mock = createMockD1();
      const db = mock as unknown as D1Database;
      const today = getTodayUtc();
      const usage = await getDailyUsage(db, 'user-1', today);
      expect(usage).toEqual({ narrativeCount: 0, partnerCount: 0, chatCount: 0 });
    });

    it('returns updated counts after recordNarrative, recordPartner, recordChat', async () => {
      const mock = createMockD1();
      const db = mock as unknown as D1Database;
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
  });

  describe('limits', () => {
    it('CHAT_DAILY_LIMIT is 10', () => {
      expect(CHAT_DAILY_LIMIT).toBe(10);
    });
  });
});
