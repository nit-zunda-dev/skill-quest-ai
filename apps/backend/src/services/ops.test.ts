import { describe, it, expect, vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import {
  getAiUsageAggregation,
  getTotalUserCount,
  getActiveUserCount,
  AI_USAGE_MAX_DAYS,
  ACTIVE_USER_DEFAULT_DAYS,
} from './ops';

/**
 * D1 モック: ops サービスの getAiUsageAggregation / getTotalUserCount / getActiveUserCount 用。
 * ai_daily_usage の日別集計、user の件数、session の直近 N 日 distinct user_id を返す。
 */
function createMockD1ForOpsService(overrides?: {
  aiUsageByDate?: Array<{ date_utc: string; total: number }>;
  userCount?: number;
  activeUserCount?: number; // withinDays で渡すとこの値を返す想定
}) {
  const aiUsageByDate = overrides?.aiUsageByDate ?? [];
  const userCount = overrides?.userCount ?? 0;
  const activeUserCount = overrides?.activeUserCount ?? 0;

  const first = vi.fn().mockImplementation(async (sql: string, ...params: unknown[]) => {
    if (sql.includes('COUNT(*)') && sql.includes('user') && !sql.includes('session')) {
      return { count: userCount };
    }
    if (sql.includes('COUNT(DISTINCT') && sql.includes('session')) {
      return { count: activeUserCount };
    }
    return null;
  });

  const all = vi.fn().mockImplementation(async (sql: string, ...params: unknown[]) => {
    if (sql.includes('ai_daily_usage') && sql.includes('SUM(neurons_estimate)') && sql.includes('GROUP BY')) {
      const from = params[0] as string;
      const to = params[1] as string;
      const filtered = aiUsageByDate.filter((r) => r.date_utc >= from && r.date_utc <= to);
      const results = filtered.map((r) => ({ date_utc: r.date_utc, total_neurons_estimate: r.total }));
      return { results };
    }
    return { results: [] };
  });

  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      first: () => first(sql, ...args),
      all: () => all(sql, ...args),
    }),
  });

  return { prepare, first, all } as unknown as D1Database;
}

describe('ops service (Task 5.1)', () => {
  describe('constants', () => {
    it('AI_USAGE_MAX_DAYS is 90', () => {
      expect(AI_USAGE_MAX_DAYS).toBe(90);
    });
    it('ACTIVE_USER_DEFAULT_DAYS is 30', () => {
      expect(ACTIVE_USER_DEFAULT_DAYS).toBe(30);
    });
  });

  describe('getAiUsageAggregation', () => {
    it('returns empty byDate and zero total when no usage in range', async () => {
      const db = createMockD1ForOpsService();
      const result = await getAiUsageAggregation(db, '2026-01-01', '2026-01-31');
      expect(result.byDate).toEqual([]);
      expect(result.totalNeuronsEstimate).toBe(0);
    });

    it('returns byDate and totalNeuronsEstimate for date range', async () => {
      const db = createMockD1ForOpsService({
        aiUsageByDate: [
          { date_utc: '2026-01-01', total: 100 },
          { date_utc: '2026-01-02', total: 200 },
        ],
      });
      const result = await getAiUsageAggregation(db, '2026-01-01', '2026-01-31');
      expect(result.byDate).toEqual([
        { date: '2026-01-01', totalNeuronsEstimate: 100 },
        { date: '2026-01-02', totalNeuronsEstimate: 200 },
      ]);
      expect(result.totalNeuronsEstimate).toBe(300);
    });

    it('includes only dates within from-to range', async () => {
      const db = createMockD1ForOpsService({
        aiUsageByDate: [
          { date_utc: '2025-12-31', total: 50 },
          { date_utc: '2026-01-01', total: 100 },
          { date_utc: '2026-01-02', total: 200 },
          { date_utc: '2026-02-01', total: 80 },
        ],
      });
      const result = await getAiUsageAggregation(db, '2026-01-01', '2026-01-15');
      expect(result.byDate.map((d) => d.date)).toContain('2026-01-01');
      expect(result.byDate.map((d) => d.date)).toContain('2026-01-02');
      expect(result.totalNeuronsEstimate).toBe(300);
    });
  });

  describe('getTotalUserCount', () => {
    it('returns 0 when no users', async () => {
      const db = createMockD1ForOpsService({ userCount: 0 });
      const count = await getTotalUserCount(db);
      expect(count).toBe(0);
    });

    it('returns user count', async () => {
      const db = createMockD1ForOpsService({ userCount: 42 });
      const count = await getTotalUserCount(db);
      expect(count).toBe(42);
    });
  });

  describe('getActiveUserCount', () => {
    it('returns 0 when no sessions in window', async () => {
      const db = createMockD1ForOpsService({ activeUserCount: 0 });
      const count = await getActiveUserCount(db, 30);
      expect(count).toBe(0);
    });

    it('returns distinct user count for withinDays', async () => {
      const db = createMockD1ForOpsService({ activeUserCount: 5 });
      const count = await getActiveUserCount(db, 30);
      expect(count).toBe(5);
    });

    it('accepts custom withinDays', async () => {
      const db = createMockD1ForOpsService({ activeUserCount: 3 });
      const count = await getActiveUserCount(db, 7);
      expect(count).toBe(3);
    });
  });
});
