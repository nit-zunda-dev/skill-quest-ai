/**
 * ガチャサービス (Task 3.1)
 * レアリティに基づく1回抽選。マスタの enabled_for_drop なアイテムのみ対象。
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Item } from '@skill-quest/shared';
import { Category, Rarity } from '@skill-quest/shared';

/** レアリティ別ドロップ重み。相対順序 common > rare > super-rare > ultra-rare > legend を保つ（設計書 2.2）。 */
export const DROP_WEIGHTS = [
  { rarity: 'common' as const, weight: 50 },
  { rarity: 'rare' as const, weight: 30 },
  { rarity: 'super-rare' as const, weight: 13 },
  { rarity: 'ultra-rare' as const, weight: 5 },
  { rarity: 'legend' as const, weight: 2 },
] as const;

type ItemsRow = {
  id: string;
  category: string;
  rarity: string;
  name: string;
  description: string | null;
  enabled_for_drop: number;
};

function rowToItem(row: ItemsRow): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    rarity: row.rarity as Rarity,
    description: row.description ?? undefined,
  };
}

/**
 * ドロップ有効なアイテムを1件取得する。確率は DROP_WEIGHTS に従う。
 * マスタが空または droppable が0件のときは null を返し、例外を投げない。
 */
export async function drawItem(db: D1Database): Promise<{ item: Item | null }> {
  const stmt = db.prepare(
    'SELECT id, category, rarity, name, description, enabled_for_drop FROM items WHERE enabled_for_drop = 1'
  );
  const { results } = await stmt.all<ItemsRow>();
  const rows = (results ?? []) as ItemsRow[];
  if (rows.length === 0) {
    return { item: null };
  }
  const byRarity = new Map<string, ItemsRow[]>();
  for (const row of rows) {
    const list = byRarity.get(row.rarity) ?? [];
    list.push(row);
    byRarity.set(row.rarity, list);
  }
  const totalWeight = DROP_WEIGHTS.filter((w) => byRarity.has(w.rarity)).reduce((s, w) => s + w.weight, 0);
  if (totalWeight === 0) {
    return { item: null };
  }
  let r = Math.random() * totalWeight;
  for (const { rarity, weight } of DROP_WEIGHTS) {
    const list = byRarity.get(rarity);
    if (!list || list.length === 0) continue;
    r -= weight;
    if (r <= 0) {
      const chosen = list[Math.floor(Math.random() * list.length)];
      return { item: rowToItem(chosen) };
    }
  }
  const fallback = rows[Math.floor(Math.random() * rows.length)];
  return { item: rowToItem(fallback) };
}

/**
 * クエスト完了時のアイテム付与（冪等）。当該 (userId, questId) で既に付与済みなら何もせず、
 * 未付与なら抽選して1件を所持履歴に記録する。抽選が null のときは INSERT しない。
 */
export async function grantItemOnQuestComplete(
  db: D1Database,
  userId: string,
  questId: string
): Promise<{ granted: boolean; item: Item | null }> {
  const checkStmt = db.prepare(
    'SELECT id FROM user_acquired_items WHERE user_id = ? AND quest_id = ?'
  );
  const existing = await checkStmt.bind(userId, questId).first();
  if (existing != null) {
    return { granted: false, item: null };
  }
  const { item } = await drawItem(db);
  if (item == null) {
    return { granted: false, item: null };
  }
  const id = crypto.randomUUID();
  const acquiredAt = Math.floor(Date.now() / 1000);
  const insertStmt = db.prepare(
    'INSERT INTO user_acquired_items (id, user_id, item_id, quest_id, acquired_at) VALUES (?, ?, ?, ?, ?)'
  );
  await insertStmt.bind(id, userId, item.id, questId, acquiredAt).run();
  return { granted: true, item };
}
