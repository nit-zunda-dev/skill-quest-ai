import type { D1Database } from '@cloudflare/workers-types';

/** 運用者 API: AI 利用量集計の日付範囲の最大日数（設計・要件 1.3） */
export const AI_USAGE_MAX_DAYS = 90;

/** アクティブユーザー定義: 直近 N 日以内にセッションが存在する（設計で固定） */
export const ACTIVE_USER_DEFAULT_DAYS = 30;

export interface AiUsageAggregationResult {
  byDate: Array<{ date: string; totalNeuronsEstimate: number }>;
  totalNeuronsEstimate: number;
}

/**
 * 指定日付範囲の AI 利用量（Neurons 概算）を日次で集計する。読み取り専用。
 * 日付範囲の検証（最大 90 日）は呼び出し元で行い、超過時は 400 を返す。
 * @param db D1
 * @param from YYYY-MM-DD（以上）
 * @param to YYYY-MM-DD（以下）
 */
export async function getAiUsageAggregation(
  db: D1Database,
  from: string,
  to: string
): Promise<AiUsageAggregationResult> {
  const { results } = await db
    .prepare(
      `SELECT date_utc, SUM(neurons_estimate) AS total_neurons_estimate
       FROM ai_daily_usage
       WHERE date_utc >= ? AND date_utc <= ?
       GROUP BY date_utc
       ORDER BY date_utc`
    )
    .bind(from, to)
    .all<{ date_utc: string; total_neurons_estimate: number | null }>();

  const byDate = (results ?? []).map((row) => ({
    date: row.date_utc,
    totalNeuronsEstimate: Number(row.total_neurons_estimate) || 0,
  }));
  const totalNeuronsEstimate = byDate.reduce((sum, d) => sum + d.totalNeuronsEstimate, 0);
  return { byDate, totalNeuronsEstimate };
}

/**
 * 登録ユーザー数（総数）を取得する。
 */
export async function getTotalUserCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS count FROM user')
    .bind()
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/**
 * アクティブユーザー数（直近 withinDays 日以内にセッションが存在する user_id の distinct 数）を取得する。
 * @param db D1
 * @param withinDays 直近何日以内のセッションを対象とするか（正の整数）
 */
export async function getActiveUserCount(db: D1Database, withinDays: number): Promise<number> {
  const cutoffSec = Math.floor(Date.now() / 1000) - withinDays * 86400;
  const row = await db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) AS count FROM session WHERE created_at >= ?`
    )
    .bind(cutoffSec)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
