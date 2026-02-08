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

/** キャラクタープロフィールを保存（サインアップ時1回のみ） */
export async function saveCharacterProfile(
  db: D1Database,
  userId: string,
  profile: unknown
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const profileJson = JSON.stringify(profile);
  await db
    .prepare('INSERT INTO user_character_profile (user_id, profile, created_at) VALUES (?, ?, ?)')
    .bind(userId, profileJson, now)
    .run();
}

/** キャラクタープロフィールを部分更新（XP、ゴールド、レベル等） */
export async function updateCharacterProfile(
  db: D1Database,
  userId: string,
  partialProfile: Record<string, unknown>
): Promise<void> {
  const current = await getCharacterProfile(db, userId);
  if (!current || typeof current !== 'object') return;
  const merged = { ...(current as Record<string, unknown>), ...partialProfile };
  const profileJson = JSON.stringify(merged);
  await db
    .prepare('UPDATE user_character_profile SET profile = ? WHERE user_id = ?')
    .bind(profileJson, userId)
    .run();
}

/** キャラクタープロフィールを取得（未生成の場合は null） */
export async function getCharacterProfile(
  db: D1Database,
  userId: string
): Promise<unknown | null> {
  const row = await db
    .prepare('SELECT profile FROM user_character_profile WHERE user_id = ?')
    .bind(userId)
    .first<{ profile: string }>();
  if (!row?.profile) return null;
  try {
    return JSON.parse(row.profile) as unknown;
  } catch {
    return null;
  }
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

/** グリモワールエントリを作成 */
export async function createGrimoireEntry(
  db: D1Database,
  userId: string,
  entry: { taskTitle: string; narrative: string; rewardXp: number; rewardGold: number }
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      'INSERT INTO grimoire_entries (id, user_id, task_title, narrative, reward_xp, reward_gold, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, userId, entry.taskTitle, entry.narrative, entry.rewardXp, entry.rewardGold, now)
    .run();
  return { id };
}

/** ユーザーのグリモワール一覧を取得（新しい順） */
export async function getGrimoireEntries(
  db: D1Database,
  userId: string
): Promise<Array<{ id: string; taskTitle: string; narrative: string; rewardXp: number; rewardGold: number; createdAt: number }>> {
  const { results } = await db
    .prepare(
      'SELECT id, task_title, narrative, reward_xp, reward_gold, created_at FROM grimoire_entries WHERE user_id = ? ORDER BY created_at DESC'
    )
    .bind(userId)
    .all<{ id: string; task_title: string; narrative: string; reward_xp: number; reward_gold: number; created_at: number }>();
  if (!results) return [];
  return results.map((r) => ({
    id: r.id,
    taskTitle: r.task_title,
    narrative: r.narrative,
    rewardXp: r.reward_xp ?? 0,
    rewardGold: r.reward_gold ?? 0,
    createdAt: r.created_at,
  }));
}

/** クエストを完了状態に更新（ナラティブ完了時） */
export async function completeQuest(
  db: D1Database,
  userId: string,
  questId: string
): Promise<boolean> {
  const result = await db
    .prepare('UPDATE quests SET completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), questId, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
