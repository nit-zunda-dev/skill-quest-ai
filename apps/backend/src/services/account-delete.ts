import type { D1Database } from '@cloudflare/workers-types';

/**
 * 指定ユーザーに紐づくデータを削除する（認証スキーマのみ想定）。
 * 子テーブル → user の順。D1 は PRAGMA foreign_keys が未対応のため明示 DELETE。
 */
export async function deleteAccountByUserId(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM session WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM account WHERE user_id = ?').bind(userId).run();

  await db
    .prepare('DELETE FROM verification WHERE identifier = (SELECT email FROM user WHERE id = ?)')
    .bind(userId)
    .run();

  const result = await db.prepare('DELETE FROM user WHERE id = ?').bind(userId).run();

  if (result.meta.changes === 0) {
    throw new Error('USER_NOT_FOUND');
  }
}
