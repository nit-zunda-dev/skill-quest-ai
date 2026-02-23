/**
 * ガチャ Task 2.1: アイテムマスタ・所持履歴テーブルのスキーマ定義の検証
 */
import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { items, userAcquiredItems, schema } from './schema';

function columnNames(table: ReturnType<typeof getTableColumns>): string[] {
  return Object.values(table).map((col) => col.name);
}

describe('gacha schema (Task 2.1)', () => {
  describe('items', () => {
    it('テーブルがスキーマに含まれる', () => {
      expect(schema).toHaveProperty('items', items);
    });

    it('一意ID・カテゴリ・レアリティ・表示名・説明・ドロップ有効フラグを持つ', () => {
      const cols = columnNames(getTableColumns(items));
      expect(cols).toContain('id');
      expect(cols).toContain('category');
      expect(cols).toContain('rarity');
      expect(cols).toContain('name');
      expect(cols).toContain('description');
      expect(cols).toContain('enabled_for_drop');
    });
  });

  describe('user_acquired_items', () => {
    it('テーブルがスキーマに含まれる', () => {
      expect(schema).toHaveProperty('userAcquiredItems', userAcquiredItems);
    });

    it('ユーザーID・アイテムID・クエストID・取得時刻を持つ', () => {
      const cols = columnNames(getTableColumns(userAcquiredItems));
      expect(cols).toContain('user_id');
      expect(cols).toContain('item_id');
      expect(cols).toContain('quest_id');
      expect(cols).toContain('acquired_at');
      expect(cols).toContain('id');
    });
  });
});
