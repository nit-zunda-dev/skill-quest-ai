import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import { deleteAccountByUserId } from './account-delete';

describe('account-delete', () => {
  let mockDb: D1Database;
  let prepareMock: ReturnType<typeof vi.fn>;
  let runMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    runMock = vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } });
    prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: runMock,
      }),
    });
    mockDb = {
      prepare: prepareMock,
    } as unknown as D1Database;
  });

  describe('deleteAccountByUserId', () => {
    it('deletes session, account, verification, user in order', async () => {
      await deleteAccountByUserId(mockDb, 'user-123');

      expect(prepareMock).toHaveBeenCalledTimes(4);
      const calls = prepareMock.mock.calls.map((call) => call[0] as string);
      expect(calls[0]).toContain('session');
      expect(calls[1]).toContain('account');
      expect(calls[2]).toContain('verification');
      expect(calls[3]).toContain('user');
    });

    it('binds userId to all delete queries', async () => {
      await deleteAccountByUserId(mockDb, 'user-456');
      const bindMocks = prepareMock.mock.results.map((r) => r.value.bind as ReturnType<typeof vi.fn>);
      bindMocks.forEach((bindFn) => {
        expect(bindFn).toHaveBeenCalledWith('user-456');
      });
    });

    it('throws when user delete affects 0 rows', async () => {
      let callCount = 0;
      runMock.mockImplementation(() => {
        callCount++;
        if (callCount === 4) {
          return Promise.resolve({ success: true, meta: { changes: 0 } });
        }
        return Promise.resolve({ success: true, meta: { changes: 1 } });
      });

      await expect(deleteAccountByUserId(mockDb, 'non-existent-user')).rejects.toThrow('USER_NOT_FOUND');
    });
  });
});
