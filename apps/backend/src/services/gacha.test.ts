/**
 * ガチャ Task 3.1: drawItem の単体テスト
 * ドロップ有効なアイテムのみ対象、確率順序維持、マスタ空時は null を返し例外を投げない。
 */
import { describe, it, expect } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import { drawItem } from './gacha';
import type { Item } from '@skill-quest/shared';

type ItemsRow = {
  id: string;
  category: string;
  rarity: string;
  name: string;
  description: string | null;
  enabled_for_drop: number;
};

function createMockD1(itemsResult: ItemsRow[]): D1Database {
  const prepare = (sql: string) => ({
    bind: (..._args: unknown[]) => ({
      all: async () => ({ results: itemsResult, success: true, meta: {} }),
      first: async () => (itemsResult.length > 0 ? itemsResult[0] : null),
    }),
    all: async () => ({ results: itemsResult, success: true, meta: {} }),
    first: async () => (itemsResult.length > 0 ? itemsResult[0] : null),
  });
  return { prepare } as unknown as D1Database;
}

describe('gacha service (Task 3.1)', () => {
  describe('drawItem', () => {
    it('マスタが空のとき item を null で返し例外を投げない', async () => {
      const db = createMockD1([]);
      const result = await drawItem(db);
      expect(result).toEqual({ item: null });
    });

    it('ドロップ有効なアイテムが0件のとき item を null で返す', async () => {
      const db = createMockD1([]);
      const result = await drawItem(db);
      expect(result.item).toBeNull();
    });

    it('ドロップ有効なアイテムが1件あるときその1件を返す', async () => {
      const row: ItemsRow = {
        id: 'drink-common-01',
        category: 'drink',
        rarity: 'common',
        name: 'エナジーウォーター',
        description: '基本的な回復飲料',
        enabled_for_drop: 1,
      };
      const db = createMockD1([row]);
      const result = await drawItem(db);
      expect(result.item).not.toBeNull();
      expect((result.item as Item).id).toBe('drink-common-01');
      expect((result.item as Item).name).toBe('エナジーウォーター');
      expect((result.item as Item).category).toBe('drink');
      expect((result.item as Item).rarity).toBe('common');
    });

    it('ドロップ有効なアイテムが複数あるとき1件だけ返す', async () => {
      const rows: ItemsRow[] = [
        { id: 'a', category: 'drink', rarity: 'common', name: 'A', description: null, enabled_for_drop: 1 },
        { id: 'b', category: 'chip', rarity: 'rare', name: 'B', description: null, enabled_for_drop: 1 },
      ];
      const db = createMockD1(rows);
      const result = await drawItem(db);
      expect(result.item).not.toBeNull();
      expect(['a', 'b']).toContain((result.item as Item).id);
      expect((result.item as Item).name).toBeDefined();
      expect((result.item as Item).category).toBeDefined();
      expect((result.item as Item).rarity).toBeDefined();
    });

    it('確率の相対順序が common > rare > ... の定数で定義されている', async () => {
      const { DROP_WEIGHTS } = await import('./gacha');
      expect(DROP_WEIGHTS).toBeDefined();
      const rarities = DROP_WEIGHTS.map((w) => w.rarity);
      expect(rarities).toEqual(['common', 'rare', 'super-rare', 'ultra-rare', 'legend']);
      const weights = DROP_WEIGHTS.map((w) => w.weight);
      expect(weights[0]).toBeGreaterThan(weights[1]);
      expect(weights[1]).toBeGreaterThan(weights[2]);
      expect(weights[2]).toBeGreaterThan(weights[3]);
      expect(weights[3]).toBeGreaterThan(weights[4]);
    });
  });
});
