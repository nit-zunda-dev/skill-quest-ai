import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import { deleteAccountByUserId } from './account-delete';

describe('account-delete', () => {
  let mockDb: D1Database;
  let prepareMock: ReturnType<typeof vi.fn>;
  let runMock: ReturnType<typeof vi.fn>;
  let firstMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    runMock = vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } });
    firstMock = vi.fn().mockResolvedValue(null);
    prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: runMock,
        first: firstMock,
      }),
    });
    mockDb = {
      prepare: prepareMock,
    } as unknown as D1Database;
  });

  describe('deleteAccountByUserId', () => {
    it('deletes all user-related data in correct order', async () => {
      await deleteAccountByUserId(mockDb, 'user-123');

      expect(prepareMock).toHaveBeenCalledTimes(11);
      const calls = prepareMock.mock.calls.map((call) => call[0] as string);

      // 1. interaction_logs
      expect(calls[0]).toContain('interaction_logs');
      expect(calls[0]).toContain('user_progress');

      // 2. user_progress
      expect(calls[1]).toContain('user_progress');

      // 3. grimoire_entries
      expect(calls[2]).toContain('grimoire_entries');

      // 4. quests
      expect(calls[3]).toContain('quests');

      // 5. session
      expect(calls[4]).toContain('session');

      // 6. account
      expect(calls[5]).toContain('account');

      // 7. user_character_generated
      expect(calls[6]).toContain('user_character_generated');
      // 8. user_character_profile
      expect(calls[7]).toContain('user_character_profile');
      // 9. ai_daily_usage
      expect(calls[8]).toContain('ai_daily_usage');

      // 10. verification
      expect(calls[9]).toContain('verification');

      // 11. user (last)
      expect(calls[10]).toContain('user');
    });

    it('binds userId to all delete queries', async () => {
      await deleteAccountByUserId(mockDb, 'user-456');

      const bindCalls = prepareMock.mock.results.map((result) => {
        const prepared = result.value;
        return prepared.bind;
      });

      // All queries should bind the userId
      bindCalls.forEach((bindFn) => {
        expect(bindFn).toHaveBeenCalledWith('user-456');
      });
    });

    it('throws error when user is not found', async () => {
      // Mock all previous queries to succeed, but the last user delete to return 0 changes
      let callCount = 0;
      runMock.mockImplementation(() => {
        callCount++;
        // Last call (user delete) should return 0 changes
        if (callCount === 11) {
          return Promise.resolve({ success: true, meta: { changes: 0 } });
        }
        return Promise.resolve({ success: true, meta: { changes: 1 } });
      });

      await expect(deleteAccountByUserId(mockDb, 'non-existent-user')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('deletes user_character_generated, user_character_profile, and ai_daily_usage', async () => {
      await deleteAccountByUserId(mockDb, 'user-789');

      const calls = prepareMock.mock.calls.map((call) => call[0] as string);
      const characterGeneratedCall = calls.find((call) => call.includes('user_character_generated'));
      const characterProfileCall = calls.find((call) => call.includes('user_character_profile'));
      const aiUsageCall = calls.find((call) => call.includes('ai_daily_usage'));

      expect(characterGeneratedCall).toBeDefined();
      expect(characterProfileCall).toBeDefined();
      expect(aiUsageCall).toBeDefined();
    });
  });
});
