/**
 * AIパートナー好感度の取得・更新。
 * 0〜FAVORABILITY_MAX でクリップ。チャット内容またはアイテム付与で加算。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { schema } from '../db/schema';

export const FAVORABILITY_MAX = 1000;
export const FAVORABILITY_MIN = 0;

/** レアリティ別の好感度加算（パートナーにアイテムを渡したとき） */
export const FAVORABILITY_BY_RARITY: Record<string, number> = {
  common: 2,
  rare: 5,
  'super-rare': 10,
  'ultra-rare': 20,
  legend: 40,
};

/** ポジティブキーワード（含まれていれば加算） */
const POSITIVE_KEYWORDS = [
  'ありがとう', '感謝', '助かった', '嬉しい', 'よかった', '頑張る', '応援', '好き',
  'ありがとうございます', 'thanks', 'thank', '嬉', '楽しい', '素敵', '最高', 'いいね',
];

/** ネガティブキーワード（含まれていれば加算なし or 減算） */
const NEGATIVE_KEYWORDS = [
  'つらい', '辛い', '嫌', '無理', 'やめ', '悲しい', 'つまらない', '嫌い',
];

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * チャットメッセージ内容に基づく好感度変動量を算出する。
 * ポジティブなら +1〜+5、ネガティブなら 0 または -1、それ以外は +1（会話したことによる微増）。
 */
export function getFavorabilityDeltaFromMessage(content: string): number {
  if (!content || content.length === 0) return 0;
  const normalized = normalizeText(content);
  if (normalized.length === 0) return 0;

  for (const k of NEGATIVE_KEYWORDS) {
    if (normalized.includes(normalizeText(k))) return 0;
  }

  let delta = 1; // デフォルトで会話した分だけ微増
  for (const k of POSITIVE_KEYWORDS) {
    if (normalized.includes(normalizeText(k))) {
      delta = Math.min(5, delta + 2);
      break;
    }
  }
  return delta;
}

/**
 * 現在の好感度を取得する。未作成なら 0 を返す。
 */
export async function getFavorability(db: D1Database, userId: string): Promise<number> {
  const orm = drizzle(db, { schema });
  const rows = await orm
    .select({ favorability: schema.partnerFavorability.favorability })
    .from(schema.partnerFavorability)
    .where(eq(schema.partnerFavorability.userId, userId))
    .limit(1);
  if (rows.length === 0) return 0;
  return Math.max(FAVORABILITY_MIN, Math.min(FAVORABILITY_MAX, rows[0].favorability));
}

/**
 * 好感度を加算し、クリップした値を返す。レコードがなければ作成する。
 */
export async function addFavorability(
  db: D1Database,
  userId: string,
  delta: number
): Promise<number> {
  if (delta <= 0) return getFavorability(db, userId);

  const now = new Date();
  const orm = drizzle(db, { schema });

  const existing = await orm
    .select({ favorability: schema.partnerFavorability.favorability })
    .from(schema.partnerFavorability)
    .where(eq(schema.partnerFavorability.userId, userId))
    .limit(1);

  const next = Math.min(
    FAVORABILITY_MAX,
    (existing.length > 0 ? existing[0].favorability : 0) + delta
  );

  if (existing.length > 0) {
    await orm
      .update(schema.partnerFavorability)
      .set({ favorability: next, updatedAt: now })
      .where(eq(schema.partnerFavorability.userId, userId));
  } else {
    await orm.insert(schema.partnerFavorability).values({
      userId,
      favorability: next,
      updatedAt: now,
    });
  }

  return next;
}
