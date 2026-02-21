import type { D1Database } from '@cloudflare/workers-types';

/**
 * 当該ユーザーのクエストを一括削除する。
 * 目標更新時のクエストリセットなどで利用する。
 */
export async function deleteAllQuestsForUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM quests WHERE user_id = ?').bind(userId).run();
}
