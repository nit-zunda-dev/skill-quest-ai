/**
 * Task 2.1: 無料枠フォールバック用の環境変数読み取り。
 * 閾値・日次上限が未設定または不正な場合は undefined を返し、フォールバック判定を行わない契約を満たす。
 */
import type { Bindings } from '../types';

export interface AiNeuronsFallbackConfig {
  /** この値以上でスタブに切り替える（未設定時は判定しない） */
  threshold?: number;
  /** 日次上限のオプション */
  dailyLimit?: number;
}

/**
 * env から AI Neurons フォールバック用の閾値・日次上限を取得する。
 * 未設定または不正な文字列の場合は対応するプロパティを undefined とする。
 * 呼び出し側で threshold が undefined のときはフォールバック判定を行わない。
 */
export function getAiNeuronsFallbackConfig(env: Bindings): AiNeuronsFallbackConfig {
  const threshold = parsePositiveInt(env.AI_NEURONS_FALLBACK_THRESHOLD);
  const dailyLimit = parsePositiveInt(env.AI_NEURONS_DAILY_LIMIT);
  return { threshold, dailyLimit };
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}
