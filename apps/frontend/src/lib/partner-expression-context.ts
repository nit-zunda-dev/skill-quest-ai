/**
 * 文脈（UI状態）から表示用表情へマッピング（Task 2.1, Requirements 3.1–3.5）
 * パートナーページとウィジェットの両方で同じルールを参照する。
 */
import type { PartnerExpression } from '@/lib/partner-assets';

/** 待機・送信中・達成・未達フォローなどのUI状態 */
export type PartnerDisplayContext = 'idle' | 'loading' | 'success' | 'retry';

const CONTEXT_TO_EXPRESSION: Record<PartnerDisplayContext, PartnerExpression> = {
  idle: 'default',
  loading: 'cheer',
  success: 'happy',
  retry: 'worried',
};

/**
 * 文脈に応じた表示用表情を返す。未定義の文脈の場合は default にフォールバックする。
 */
export function getExpressionFromContext(
  context: PartnerDisplayContext
): PartnerExpression {
  return CONTEXT_TO_EXPRESSION[context] ?? 'default';
}
