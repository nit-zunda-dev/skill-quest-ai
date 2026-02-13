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
      expect(usage).toEqual({ narrativeCount: 0, partnerCount: 0, chatCount: 0, grimoireCount: 0 });
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
  });

  describe('limits', () => {
    it('CHAT_DAILY_LIMIT is 10', () => {
      expect(CHAT_DAILY_LIMIT).toBe(10);
    });
  });
});
