/**
 * レガシーテーブル削除マイグレーションの存在確認
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const migrationsDir = path.resolve(__dirname, '..', '..', 'migrations');

describe('legacy drop migration (phase 1)', () => {
  it('0012 drops legacy app tables in dependency-safe order', () => {
    const content = fs.readFileSync(path.join(migrationsDir, '0012_drop_legacy_app_tables.sql'), 'utf-8');
    expect(content).toContain('DROP TABLE IF EXISTS interaction_logs');
    expect(content).toContain('DROP TABLE IF EXISTS user_progress');
    expect(content).toContain('DROP TABLE IF EXISTS items');
    expect(content).toContain('DROP TABLE IF EXISTS rate_limit_logs');
    expect(content.indexOf('interaction_logs')).toBeLessThan(content.indexOf('user_progress'));
    expect(content.indexOf('user_progress')).toBeLessThan(content.indexOf('quests'));
  });
});
