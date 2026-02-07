import type { D1Database } from '@cloudflare/workers-types';

/** 1日あたりチャット利用上限（06_AI設計.md） */
export const CHAT_DAILY_LIMIT = 10;

/** 今日の日付を UTC で YYYY-MM-DD にする */
export function getTodayUtc(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** キャラ生成済みか */
export async function hasCharacterGenerated(db: D1Database, userId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT user_id FROM user_character_generated WHERE user_id = ?')
    .bind(userId)
    .first<{ user_id: string }>();
  return row != null;
}

/** キャラ生成済みを記録 */
export async function recordCharacterGenerated(db: D1Database, userId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare('INSERT INTO user_character_generated (user_id, created_at) VALUES (?, ?)')
    .bind(userId, now)
    .run();
}

/** 指定日の利用回数を取得（レコードがなければ 0） */
export async function getDailyUsage(
  db: D1Database,
  userId: string,
  dateUtc: string
): Promise<{ narrativeCount: number; partnerCount: number; chatCount: number }> {
  const row = await db
    .prepare(
      'SELECT narrative_count, partner_count, chat_count FROM ai_daily_usage WHERE user_id = ? AND date_utc = ?'
    )
    .bind(userId, dateUtc)
    .first<{ narrative_count: number; partner_count: number; chat_count: number }>();
  if (!row) {
    return { narrativeCount: 0, partnerCount: 0, chatCount: 0 };
  }
  return {
    narrativeCount: row.narrative_count ?? 0,
    partnerCount: row.partner_count ?? 0,
    chatCount: row.chat_count ?? 0,
  };
}

/** ナラティブ利用を1回記録（日次1回のため 1 にセット） */
export async function recordNarrative(db: D1Database, userId: string, dateUtc: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ai_daily_usage (user_id, date_utc, narrative_count, partner_count, chat_count)
       VALUES (?, ?, 1, 0, 0)
       ON CONFLICT(user_id, date_utc) DO UPDATE SET narrative_count = 1`
    )
    .bind(userId, dateUtc)
    .run();
}

/** パートナーメッセージ利用を1回記録 */
export async function recordPartner(db: D1Database, userId: string, dateUtc: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ai_daily_usage (user_id, date_utc, narrative_count, partner_count, chat_count)
       VALUES (?, ?, 0, 1, 0)
       ON CONFLICT(user_id, date_utc) DO UPDATE SET partner_count = 1`
    )
    .bind(userId, dateUtc)
    .run();
}

/** チャット利用を1回加算 */
export async function recordChat(db: D1Database, userId: string, dateUtc: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ai_daily_usage (user_id, date_utc, narrative_count, partner_count, chat_count)
       VALUES (?, ?, 0, 0, 1)
       ON CONFLICT(user_id, date_utc) DO UPDATE SET chat_count = chat_count + 1`
    )
    .bind(userId, dateUtc)
    .run();
}
