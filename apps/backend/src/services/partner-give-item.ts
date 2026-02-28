/**
 * パートナー／ペットにアイテムを渡す。記録のみで所持は消費しない。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { addFavorability, getFavorability, FAVORABILITY_BY_RARITY } from './partner-favorability';

export type GiveItemTarget = 'partner' | 'pet';

export interface GiveItemResult {
  favorability: number;
  lastPetRarity: string | null;
}

/**
 * ユーザーが指定アイテムを1つ以上所持しているか確認する。
 */
async function userHasItem(db: D1Database, userId: string, itemId: string): Promise<boolean> {
  const stmt = db
    .prepare('SELECT 1 FROM user_acquired_items WHERE user_id = ? AND item_id = ? LIMIT 1')
    .bind(userId, itemId);
  const { results } = await stmt.all<{ '1': number }>();
  return (results?.length ?? 0) > 0;
}

/**
 * アイテムのレアリティを取得する。
 */
async function getItemRarity(db: D1Database, itemId: string): Promise<string | null> {
  const stmt = db.prepare('SELECT rarity FROM items WHERE id = ?').bind(itemId);
  const { results } = await stmt.all<{ rarity: string }>();
  if (!results?.length) return null;
  return results[0].rarity;
}

/**
 * ユーザーがペットに最後に渡したアイテムのレアリティを取得する（直近1件）。
 */
export async function getLastPetGrantRarity(db: D1Database, userId: string): Promise<string | null> {
  const stmt = db
    .prepare(
      `SELECT i.rarity FROM partner_item_grants g
       JOIN items i ON g.item_id = i.id
       WHERE g.user_id = ? AND g.target = 'pet'
       ORDER BY g.granted_at DESC LIMIT 1`
    )
    .bind(userId);
  const { results } = await stmt.all<{ rarity: string }>();
  if (!results?.length) return null;
  return results[0].rarity;
}

/**
 * アイテムをパートナーまたはペットに渡す。記録のみで所持は減らさない。
 * ユーザーがそのアイテムを所持していない場合はエラー。
 * target が partner のときはレアリティに応じて好感度を加算する。
 */
export async function giveItemToPartnerOrPet(
  db: D1Database,
  userId: string,
  itemId: string,
  target: GiveItemTarget
): Promise<GiveItemResult> {
  const hasItem = await userHasItem(db, userId, itemId);
  if (!hasItem) {
    throw new Error('USER_DOES_NOT_OWN_ITEM');
  }

  const rarity = await getItemRarity(db, itemId);
  if (!rarity) {
    throw new Error('ITEM_NOT_FOUND');
  }

  const id = crypto.randomUUID();
  const grantedAt = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      'INSERT INTO partner_item_grants (id, user_id, item_id, target, granted_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, userId, itemId, target, grantedAt)
    .run();

  if (target === 'partner') {
    const delta = FAVORABILITY_BY_RARITY[rarity] ?? FAVORABILITY_BY_RARITY.common ?? 2;
    await addFavorability(db, userId, delta);
  }

  const favorability = await getFavorability(db, userId);
  const lastPetRarity = await getLastPetGrantRarity(db, userId);

  return { favorability, lastPetRarity };
}
