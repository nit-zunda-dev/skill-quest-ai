/**
 * ガチャ Task 2.2: items / user_acquired_items 用マイグレーションの検証
 * 既存のマイグレーション手順で適用できる SQL が存在することを保証する。
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const migrationsDir = path.resolve(__dirname, '..', '..', 'migrations');

function readMigrationContent(basename: string): string {
  const filePath = path.join(migrationsDir, basename);
  return fs.readFileSync(filePath, 'utf-8');
}

function findMigrationContaining(needle: string): string | null {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  for (const f of files.sort()) {
    const content = readMigrationContent(f);
    if (content.includes(needle)) return content;
  }
  return null;
}

describe('gacha migrations (Task 2.2)', () => {
  it('items テーブルを作成するマイグレーションが存在する', () => {
    const content = findMigrationContaining('CREATE TABLE `items`');
    expect(content).not.toBeNull();
    expect(content).toMatch(/CREATE TABLE `items`/);
    expect(content).toMatch(/`id` text PRIMARY KEY/);
    expect(content).toMatch(/`category` text NOT NULL/);
    expect(content).toMatch(/`rarity` text NOT NULL/);
    expect(content).toMatch(/`name` text NOT NULL/);
    expect(content).toMatch(/`enabled_for_drop`/);
  });

  it('user_acquired_items テーブルを作成するマイグレーションが存在する', () => {
    const content = findMigrationContaining('CREATE TABLE `user_acquired_items`');
    expect(content).not.toBeNull();
    expect(content).toMatch(/`user_id` text NOT NULL/);
    expect(content).toMatch(/`item_id` text NOT NULL/);
    expect(content).toMatch(/`quest_id` text/);
    expect(content).toMatch(/`acquired_at` integer NOT NULL/);
    expect(content).toMatch(/REFERENCES `user`|REFERENCES `items`|REFERENCES `quests`/);
  });

  it('所持一覧取得用に user_id と acquired_at のインデックスが検討されている', () => {
    const content = findMigrationContaining('CREATE TABLE `user_acquired_items`');
    expect(content).not.toBeNull();
    // 一覧取得は user_id で検索し acquired_at 降順のためインデックスを検討（設計書）
    const hasIndex =
      content!.includes('CREATE INDEX') &&
      (content!.includes('user_id') || content!.includes('user_acquired_items'));
    expect(hasIndex).toBe(true);
  });
});

describe('gacha initial item master (Task 2.3)', () => {
  const requiredCategories = ['drink', 'chip', 'badge', 'tool', 'artifact', 'android', 'mythical'];
  const requiredRarities = ['common', 'rare', 'super-rare', 'ultra-rare', 'legend'];

  it('初期アイテムマスタを投入するマイグレーションまたはシードが存在する', () => {
    const content = findMigrationContaining('INSERT INTO `items`');
    expect(content).not.toBeNull();
  });

  it('仕様の7カテゴリすべてに相当するアイテムが含まれる', () => {
    const content = findMigrationContaining('INSERT INTO `items`');
    expect(content).not.toBeNull();
    for (const cat of requiredCategories) {
      expect(content!).toMatch(new RegExp(`'${cat}'|"\${cat}"|\\\`${cat}\\\``));
    }
  });

  it('5段階レアリティすべてに相当するアイテムが含まれる', () => {
    const content = findMigrationContaining('INSERT INTO `items`');
    expect(content).not.toBeNull();
    for (const r of requiredRarities) {
      expect(content!).toMatch(new RegExp(r.replace('-', '[- ]')));
    }
  });

  it('抽選対象アイテムにドロップ有効フラグが立っている', () => {
    const content = findMigrationContaining('INSERT INTO `items`');
    expect(content).not.toBeNull();
    expect(content!).toMatch(/enabled_for_drop.*1|1.*enabled_for_drop/);
  });

  it('本番未投入のままデプロイしない旨がマイグレーション内で文書化されている', () => {
    const content = findMigrationContaining('INSERT INTO `items`');
    expect(content).not.toBeNull();
    expect(content!).toMatch(/本番|デプロイ|マイグレーション.*適用/);
  });
});
