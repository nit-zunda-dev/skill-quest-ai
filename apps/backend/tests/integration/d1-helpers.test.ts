/**
 * Task 5.1: D1ローカルバインディング用ヘルパーのテスト
 * - マイグレーション適用・DBリセット・テストデータ投入ヘルパーの振る舞いを検証
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';

vi.mock('node:child_process', () => ({ execSync: vi.fn() }));

import { execSync } from 'node:child_process';
import {
  getBackendDir,
  getD1DatabaseName,
  applyMigrationsForLocal,
  resetD1Local,
  seedD1Local,
} from './d1-helpers';

const execSyncMock = vi.mocked(execSync);

describe('d1-helpers (Task 5.1)', () => {
  const backendDir = path.resolve(__dirname, '..', '..');

  describe('getBackendDir', () => {
    it('returns absolute path to apps/backend', () => {
      const dir = getBackendDir();
      expect(dir).toBe(backendDir);
      expect(dir).toContain('backend');
    });
  });

  describe('getD1DatabaseName', () => {
    it('returns local D1 database name from wrangler.toml', () => {
      expect(getD1DatabaseName()).toBe('skill-quest-db');
    });
  });

  describe('applyMigrationsForLocal', () => {
    beforeEach(() => {
      execSyncMock.mockReturnValue(Buffer.from(''));
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('invokes wrangler d1 migrations apply with --local', () => {
      applyMigrationsForLocal();

      expect(execSyncMock).toHaveBeenCalledWith(
        'wrangler d1 migrations apply skill-quest-db --local',
        expect.objectContaining({
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      );
    });

    it('uses custom cwd when options.cwd is provided', () => {
      const customCwd = path.join(backendDir, 'migrations');

      applyMigrationsForLocal({ cwd: customCwd });

      expect(execSyncMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cwd: customCwd })
      );
    });
  });

  describe('resetD1Local', () => {
    beforeEach(() => {
      execSyncMock.mockReturnValue(Buffer.from(''));
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('executes reset SQL via wrangler d1 execute --local --file', () => {
      resetD1Local();

      expect(execSyncMock).toHaveBeenCalled();
      const call = execSyncMock.mock.calls[0];
      expect(call[0]).toMatch(/wrangler d1 execute skill-quest-db --local/);
      expect(call[0]).toMatch(/--file=.+reset\.sql/);
    });

    it('uses reset.sql file next to d1-helpers', () => {
      resetD1Local();

      const call = execSyncMock.mock.calls[0];
      expect(call[0]).toContain('reset.sql');
    });
  });

  describe('seedD1Local', () => {
    beforeEach(() => {
      execSyncMock.mockReturnValue(Buffer.from(''));
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('executes seed SQL file via wrangler d1 execute --local --file', () => {
      const seedPath = path.join(backendDir, 'tests', 'integration', 'seed-example.sql');
      seedD1Local(seedPath);

      expect(execSyncMock).toHaveBeenCalledWith(
        expect.stringContaining('wrangler d1 execute skill-quest-db --local'),
        expect.objectContaining({
          cwd: backendDir,
          encoding: 'utf-8',
        })
      );
      const call = execSyncMock.mock.calls[0];
      expect(call[0]).toMatch(/--file=.+\.sql/);
    });

    it('throws when seed file does not exist', () => {
      const nonexistent = path.join(backendDir, 'tests', 'integration', 'nonexistent-seed-12345.sql');
      expect(fs.existsSync(nonexistent)).toBe(false);

      expect(() => seedD1Local(nonexistent)).toThrow(/Seed file not found/);
    });
  });
});
