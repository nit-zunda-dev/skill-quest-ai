/**
 * Task 4.1: 構造化ログヘルパー（Requirements: 5.1, 5.4）
 * 機密キーをマスキングし JSON で console に出力する。トークン・パスワード・認証ヘッダ等は含めない。
 */

const SENSITIVE_KEYS = new Set([
  'token',
  'password',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'secret',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function sanitize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = isSensitiveKey(k) ? '[REDACTED]' : sanitize(v);
  }
  return out;
}

/**
 * 渡されたフィールドをサニタイズ（機密キー名のマスキング）し、JSON で console.log する。
 * トークン・パスワード・authorization・cookie 等の値は [REDACTED] に置換する。
 */
export function logStructured(fields: Record<string, unknown>): void {
  const withTimestamp = {
    ...fields,
    timestamp: fields.timestamp ?? new Date().toISOString(),
  };
  const sanitized = sanitize(withTimestamp) as Record<string, unknown>;
  console.log(JSON.stringify(sanitized));
}
