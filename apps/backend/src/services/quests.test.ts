import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import { deleteAllQuestsForUser } from './quests';

describe('quests service', () => {
  let mockDb: D1Database;
  let prepareMock: ReturnType<typeof vi.fn>;
  let runMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    runMock = vi.fn().mockResolvedValue({ success: true, meta: {} });
    prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({ run: runMock }),
    });
    mockDb = { prepare: prepareMock } as unknown as D1Database;
  });

  describe('deleteAllQuestsForUser', () => {
    it('executes DELETE FROM quests WHERE user_id = ?', async () => {
      await deleteAllQuestsForUser(mockDb, 'user-1');

      expect(prepareMock).toHaveBeenCalledTimes(1);
      const sql = prepareMock.mock.calls[0][0] as string;
      expect(sql).toContain('DELETE FROM quests');
      expect(sql).toContain('user_id');
    });

    it('binds the given userId to the statement', async () => {
      await deleteAllQuestsForUser(mockDb, 'user-abc');

      const prepared = prepareMock.mock.results[0].value;
      expect(prepared.bind).toHaveBeenCalledWith('user-abc');
    });

    it('runs the statement and completes without throwing', async () => {
      await expect(deleteAllQuestsForUser(mockDb, 'user-1')).resolves.toBeUndefined();
      expect(runMock).toHaveBeenCalledTimes(1);
    });
  });
});
