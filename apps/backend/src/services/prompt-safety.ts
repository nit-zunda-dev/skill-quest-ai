/**
 * プロンプトサニタイズとセーフティチェック（Req 11.3, 11.4）
 * - プロンプトインジェクション対策
 * - 不適切コンテンツ検出（Llama Guard 等の統合は将来拡張）
 */

const MAX_PROMPT_LENGTH = 20_000;

/** プロンプトインジェクションとみなすパターン（除去または無効化） */
const INJECTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /ignore\s+(all\s+)?(previous|above)\s+instructions?/gi, replacement: '' },
  { pattern: /disregard\s+(all\s+)?(previous|above)\s+instructions?/gi, replacement: '' },
  { pattern: /you\s+are\s+now\s+(a|an)\s+[^.]+\.?/gi, replacement: '' },
  { pattern: /###\s*(System|Instruction|User|Assistant)\s*:\s*[^\n]*/gi, replacement: '' },
  { pattern: /<\s*system\s*>\s*[\s\S]*?<\s*\/\s*system\s*>/gi, replacement: '' },
];

/** 不適切コンテンツ検出用のブロックパターン（最小限。Llama Guard は将来拡張） */
const UNSAFE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /output\s+(system\s+)?prompt|dump\s+(your\s+)?(system\s+)?prompt/gi, reason: 'prompt_leak' },
  { pattern: /disregard\s+all\s+instructions/gi, reason: 'injection' },
  { pattern: /暴力的|暴力を|暴力で/gi, reason: 'inappropriate' },
];

export type SafetyResult = { safe: true } | { safe: false; reason: string };

/**
 * ユーザー入力をサニタイズし、プロンプトインジェクションに使われがちな表現を除去・無効化する。
 */
export function sanitizePrompt(input: string): string {
  if (typeof input !== 'string') return '';
  let s = input.normalize('NFKC').trim();
  for (const { pattern, replacement } of INJECTION_PATTERNS) {
    s = s.replace(pattern, replacement);
  }
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > MAX_PROMPT_LENGTH) {
    s = s.slice(0, MAX_PROMPT_LENGTH);
  }
  return s;
}

/**
 * 不適切なコンテンツを検出する。安全なら { safe: true }、そうでなければ { safe: false, reason }。
 * 将来 Llama Guard 等のセーフティモデルに差し替え可能なインターフェース。
 */
export function checkContentSafety(input: string): SafetyResult {
  if (typeof input !== 'string') return { safe: true };
  const normalized = input.normalize('NFKC');
  for (const { pattern, reason } of UNSAFE_PATTERNS) {
    if (pattern.test(normalized)) return { safe: false, reason };
  }
  return { safe: true };
}

/**
 * ユーザー入力をサニタイズし、セーフティチェックを通したうえで利用可能な文字列を返す。
 * 不安全な場合は null を返し、呼び出し元で 400 等を返す。
 */
export function prepareUserPrompt(input: string): { ok: true; sanitized: string } | { ok: false; reason: string } {
  const sanitized = sanitizePrompt(input);
  const safety = checkContentSafety(sanitized);
  if (!safety.safe) return { ok: false, reason: (safety as { safe: false; reason: string }).reason };
  if (sanitized.length === 0) return { ok: false, reason: 'empty' };
  return { ok: true, sanitized };
}
