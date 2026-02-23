/**
 * ガチャ Task 3.1 / 3.2 / 7.1: drawItem と grantItemOnQuestComplete の単体テスト
 * 7.1: 抽選はドロップ有効のみ、同一クエストで2回付与しない、マスタ空で付与なしを検証
 */
import { describe, it, expect } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import { drawItem, grantItemOnQuestComplete } from './gacha';
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

  describe('grantItemOnQuestComplete (Task 3.2)', () => {
    it('当該クエストで既に付与済みなら何もせず granted false, item null を返す', async () => {
      const db = createMockD1ForGrant({ alreadyGranted: true, droppableItems: [itemRow('x')] });
      const result = await grantItemOnQuestComplete(db, 'user-1', 'quest-1');
      expect(result.granted).toBe(false);
      expect(result.item).toBeNull();
    });

    it('未付与なら抽選して1件記録し granted true と item を返す', async () => {
      const db = createMockD1ForGrant({ alreadyGranted: false, droppableItems: [itemRow('drink-01')] });
      const result = await grantItemOnQuestComplete(db, 'user-1', 'quest-1');
      expect(result.granted).toBe(true);
      expect(result.item).not.toBeNull();
      expect((result.item as Item).id).toBe('drink-01');
    });

    it('抽選結果が null（マスタ空）なら INSERT せず granted false, item null を返す', async () => {
      const db = createMockD1ForGrant({ alreadyGranted: false, droppableItems: [] });
      const result = await grantItemOnQuestComplete(db, 'user-1', 'quest-1');
      expect(result.granted).toBe(false);
      expect(result.item).toBeNull();
    });

    it('付与時に user_id, item_id, quest_id, acquired_at を所持履歴に記録する', async () => {
      const db = createMockD1ForGrant({ alreadyGranted: false, droppableItems: [itemRow('item-1')] });
      await grantItemOnQuestComplete(db, 'u-1', 'q-1');
      const insertCalls = (db as { _insertCalls?: unknown[] })._insertCalls ?? [];
      expect(insertCalls.length).toBe(1);
      expect(insertCalls[0]).toMatchObject({ user_id: 'u-1', item_id: 'item-1', quest_id: 'q-1' });
      expect((insertCalls[0] as { acquired_at: number }).acquired_at).toBeDefined();
    });
  });

  describe('Task 7.1: 抽選・付与の単体検証', () => {
    it('抽選はドロップ有効なアイテム（enabled_for_drop=1）のみを対象とする', async () => {
      const sqlLog: string[] = [];
      const db = createMockD1WithSqlLog(sqlLog, [itemRow('only-droppable')]);
      await drawItem(db);
      const itemsSelect = sqlLog.find((s) => s.includes('items') && s.includes('enabled_for_drop'));
      expect(itemsSelect).toBeDefined();
      expect(itemsSelect).toContain('enabled_for_drop = 1');
    });

    it('同一クエストで2回付与を呼んでも2回目は付与せず INSERT は1回だけ', async () => {
      const db = createMockD1ForGrantTwice({ droppableItems: [itemRow('item-x')] });
      await grantItemOnQuestComplete(db, 'user-1', 'quest-1');
      await grantItemOnQuestComplete(db, 'user-1', 'quest-1');
      const insertCalls = (db as { _insertCalls?: unknown[] })._insertCalls ?? [];
      expect(insertCalls.length).toBe(1);
      expect(insertCalls[0]).toMatchObject({ user_id: 'user-1', quest_id: 'quest-1' });
    });

    it('マスタが空のときは付与せず granted false, item null を返す', async () => {
      const db = createMockD1ForGrant({ alreadyGranted: false, droppableItems: [] });
      const result = await grantItemOnQuestComplete(db, 'user-1', 'quest-1');
      expect(result.granted).toBe(false);
      expect(result.item).toBeNull();
      const insertCalls = (db as { _insertCalls?: unknown[] })._insertCalls ?? [];
      expect(insertCalls.length).toBe(0);
    });
  });
});

function itemRow(id: string): ItemsRow {
  return { id, category: 'drink', rarity: 'common', name: 'Test', description: null, enabled_for_drop: 1 };
}

function createMockD1ForGrant(options: {
  alreadyGranted: boolean;
  droppableItems: ItemsRow[];
}): D1Database {
  const { alreadyGranted, droppableItems } = options;
  const insertCalls: { id: string; user_id: string; item_id: string; quest_id: string; acquired_at: number }[] = [];
  const prepare = (sql: string) => {
    const bind = (...args: unknown[]) => ({
      run: async () => {
        if (sql.includes('INSERT INTO') && sql.includes('user_acquired_items')) {
          insertCalls.push({
            id: args[0] as string,
            user_id: args[1] as string,
            item_id: args[2] as string,
            quest_id: args[3] as string,
            acquired_at: args[4] as number,
          });
        }
        return { success: true, meta: {} };
      },
      first: async () => {
        if (sql.includes('user_acquired_items') && sql.includes('user_id') && sql.includes('quest_id')) {
          return alreadyGranted ? { id: 'existing' } : null;
        }
        return null;
      },
      all: async () => {
        if (sql.includes('items') && sql.includes('enabled_for_drop')) {
          return { results: droppableItems, success: true, meta: {} };
        }
        return { results: [], success: true, meta: {} };
      },
    });
    return {
      bind: (...args: unknown[]) => bind(...args),
      run: async () => (sql.includes('INSERT') ? (insertCalls.push({ id: '', user_id: '', item_id: '', quest_id: '', acquired_at: 0 }), { success: true }) : { success: true }),
      first: async () => (sql.includes('user_acquired_items') && alreadyGranted ? { id: 'existing' } : null),
      all: async () => (sql.includes('items') && sql.includes('enabled_for_drop') ? { results: droppableItems } : { results: [] }),
    };
  };
  const db = { prepare } as unknown as D1Database & { _insertCalls: typeof insertCalls };
  (db as { _insertCalls?: typeof insertCalls })._insertCalls = insertCalls;
  Object.defineProperty(db, '_insertCalls', { value: insertCalls, writable: false });
  return db;
}

/** drawItem で prepare に渡された SQL を記録するモック（Task 7.1: enabled_for_drop 条件の検証用） */
function createMockD1WithSqlLog(sqlLog: string[], itemsResult: ItemsRow[]): D1Database {
  const prepare = (sql: string) => {
    sqlLog.push(sql);
    return {
      bind: (..._args: unknown[]) => ({
        all: async () => ({ results: itemsResult, success: true, meta: {} }),
        first: async () => (itemsResult.length > 0 ? itemsResult[0] : null),
      }),
      all: async () => ({ results: itemsResult, success: true, meta: {} }),
      first: async () => (itemsResult.length > 0 ? itemsResult[0] : null),
    };
  };
  return { prepare } as unknown as D1Database;
}

/** 1回目は未付与・2回目は付与済みとして first() を返すモック（Task 7.1: 同一クエストで2回付与しない検証用） */
function createMockD1ForGrantTwice(options: { droppableItems: ItemsRow[] }): D1Database {
  const insertCalls: { id: string; user_id: string; item_id: string; quest_id: string; acquired_at: number }[] = [];
  let grantCallCount = 0;
  const prepare = (sql: string) => {
    const bind = (...args: unknown[]) => ({
      run: async () => {
        if (sql.includes('INSERT INTO') && sql.includes('user_acquired_items')) {
          insertCalls.push({
            id: args[0] as string,
            user_id: args[1] as string,
            item_id: args[2] as string,
            quest_id: args[3] as string,
            acquired_at: args[4] as number,
          });
        }
        return { success: true, meta: {} };
      },
      first: async () => {
        if (sql.includes('user_acquired_items') && sql.includes('user_id') && sql.includes('quest_id')) {
          grantCallCount += 1;
          return grantCallCount >= 2 ? { id: 'existing' } : null;
        }
        return null;
      },
      all: async () => {
        if (sql.includes('items') && sql.includes('enabled_for_drop')) {
          return { results: options.droppableItems, success: true, meta: {} };
        }
        return { results: [], success: true, meta: {} };
      },
    });
    return {
      bind: (...args: unknown[]) => bind(...args),
      run: async () => ({ success: true, meta: {} }),
      first: async () => null,
      all: async () => (sql.includes('items') && sql.includes('enabled_for_drop') ? { results: options.droppableItems } : { results: [] }),
    };
  };
  const db = { prepare } as unknown as D1Database & { _insertCalls: typeof insertCalls };
  (db as { _insertCalls?: typeof insertCalls })._insertCalls = insertCalls;
  Object.defineProperty(db, '_insertCalls', { value: insertCalls, writable: false });
  return db;
}
