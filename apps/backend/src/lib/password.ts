/**
 * Cloudflare Workers 対応のパスワードハッシュモジュール
 *
 * Better Auth デフォルトの scrypt は CPU 集約型で、Workers Free プラン（10ms CPU 制限）を超過しやすい。
 * そこで Web Crypto API の PBKDF2（SHA-256, 100,000 iterations）を使用し、
 * Workers Free プランの CPU 制限内でパスワードハッシュを実現する。
 *
 * 参考: https://lord.technology/2024/02/21/hashing-passwords-on-cloudflare-workers.html
 * 参考: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // bytes
const KEY_LENGTH = 256; // bits (AES-GCM key length)

/**
 * パスワードをハッシュする（PBKDF2 + SHA-256）
 * @param password 平文のパスワード
 * @returns "saltHex:hashHex" 形式のハッシュ文字列
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );

  const exportedKey = (await crypto.subtle.exportKey('raw', key)) as ArrayBuffer;
  const hashBuffer = new Uint8Array(exportedKey);
  const hashHex = Array.from(hashBuffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
}

/**
 * パスワードを検証する
 * @param data.hash 保存されたハッシュ文字列 ("saltHex:hashHex")
 * @param data.password 入力された平文のパスワード
 * @returns 一致すれば true
 */
export async function verifyPassword(data: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const { hash, password } = data;

  if (!hash || !hash.includes(':')) {
    return false;
  }

  const [saltHex, originalHash] = hash.split(':');
  const matchResult = saltHex.match(/.{1,2}/g);
  if (!matchResult) {
    return false;
  }

  const salt = new Uint8Array(matchResult.map((byte) => parseInt(byte, 16)));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );

  const exportedKey = (await crypto.subtle.exportKey('raw', key)) as ArrayBuffer;
  const hashBuffer = new Uint8Array(exportedKey);
  const attemptHash = Array.from(hashBuffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // timing-safe comparison を簡易実装
  if (attemptHash.length !== originalHash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < attemptHash.length; i++) {
    result |= attemptHash.charCodeAt(i) ^ originalHash.charCodeAt(i);
  }
  return result === 0;
}
