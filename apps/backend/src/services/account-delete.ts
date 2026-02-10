import type { D1Database } from '@cloudflare/workers-types';

/**
 * 指定ユーザーIDに紐づくすべてのデータを削除する。
 * 削除順序は外部キー依存関係に従う（子→親）。
 * D1ではPRAGMA foreign_keysが未対応のため、明示的に全テーブルを削除する。
 */
export async function deleteAccountByUserId(db: D1Database, userId: string): Promise<void> {
  // 1. interaction_logs (user_progress を参照)
  await db
    .prepare(
      'DELETE FROM interaction_logs WHERE progress_id IN (SELECT id FROM user_progress WHERE user_id = ?)'
    )
    .bind(userId)
    .run();

  // 2. user_progress
  await db.prepare('DELETE FROM user_progress WHERE user_id = ?').bind(userId).run();

  // 3. grimoire_entries (user_id に紐づく)
  await db.prepare('DELETE FROM grimoire_entries WHERE user_id = ?').bind(userId).run();

  // 4. quests (user_id に紐づく)
  await db.prepare('DELETE FROM quests WHERE user_id = ?').bind(userId).run();

  // 5. session, account (Better Auth)
  await db.prepare('DELETE FROM session WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM account WHERE user_id = ?').bind(userId).run();

  // 6. アプリケーション用ユーザー関連
  await db.prepare('DELETE FROM user_character_generated WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM user_character_profile WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM ai_daily_usage WHERE user_id = ?').bind(userId).run();

  // 7. verification（identifier にメールが入る場合があるため、該当ユーザーのメールで削除）
  await db
    .prepare('DELETE FROM verification WHERE identifier = (SELECT email FROM user WHERE id = ?)')
    .bind(userId)
    .run();

  // 8. user（最後に削除）
  const result = await db.prepare('DELETE FROM user WHERE id = ?').bind(userId).run();

  if (result.meta.changes === 0) {
    throw new Error('USER_NOT_FOUND');
  }
}
