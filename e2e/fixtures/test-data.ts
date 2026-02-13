/**
 * E2Eテスト用のテストデータセットアップ・クリーンアップ関数
 * テスト実行前にデータセットアップ、テスト後にクリーンアップする。
 * テスト間で状態を共有しないため、各テストで必要に応じて setup / cleanup を呼ぶ。
 * @see .kiro/specs/test-strategy-implementation/design.md (E2ETestInfrastructure)
 */

export interface E2ETestDataOptions {
  email?: string;
  password?: string;
  name?: string;
}

export interface E2ETestContext {
  cookie: string;
  email: string;
  name: string;
}

/**
 * E2E実行時のベースURLを取得する。
 * 環境変数 E2E_BASE_URL または PLAYWRIGHT_BASE_URL を参照し、未設定なら undefined。
 */
export function getE2EBaseUrl(): string | undefined {
  const url = process.env.E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
  if (!url || url === '') return undefined;
  return url.replace(/\/$/, '');
}

/**
 * テスト実行前のデータセットアップ。
 * サインアップしてサインインし、セッションCookieとユーザー情報を返す。
 * @param baseUrl アプリのベースURL（例: http://localhost:5173）
 * @param overrides メール・パスワード・名前のオプション
 */
export async function setupTestData(
  baseUrl: string,
  overrides?: E2ETestDataOptions
): Promise<E2ETestContext> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = overrides?.email ?? `e2e-${suffix}@example.com`;
  const password = overrides?.password ?? 'E2ETestPassword123!';
  const name = overrides?.name ?? 'E2E Test User';

  const signUpRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!signUpRes.ok) {
    const text = await signUpRes.text();
    throw new Error(`sign-up failed: ${signUpRes.status} ${text}`);
  }

  const signInRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!signInRes.ok) {
    const text = await signInRes.text();
    throw new Error(`sign-in failed: ${signInRes.status} ${text}`);
  }

  const cookie = signInRes.headers.get('set-cookie') ?? '';
  if (!cookie) throw new Error('sign-in did not return set-cookie');

  return { cookie, email, name };
}

/**
 * テスト後のクリーンアップ。
 * 渡されたセッションCookieでサインアウトする。
 * @param baseUrl アプリのベースURL
 * @param cookie セッションCookie（set-cookie ヘッダーそのまま）
 */
export async function cleanupTestData(baseUrl: string, cookie: string): Promise<void> {
  await fetch(`${baseUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
}
