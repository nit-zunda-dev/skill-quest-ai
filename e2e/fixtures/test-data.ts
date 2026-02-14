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
 * E2E実行時のベースURL（ブラウザで開くフロントエンド）を取得する。
 * 環境変数 E2E_BASE_URL または PLAYWRIGHT_BASE_URL を参照し、未設定なら undefined。
 */
export function getE2EBaseUrl(): string | undefined {
  const url = process.env.E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
  if (!url || url === '') return undefined;
  return url.replace(/\/$/, '');
}

/**
 * E2E実行時のAPIベースURLを取得する。
 * フロントとAPIが別ポートの場合は E2E_API_URL を設定（例: http://localhost:8787）。
 * 未設定の場合は getE2EBaseUrl() と同じ（同一オリジン）を使用。
 */
export function getE2EApiUrl(baseUrl: string): string {
  const url = process.env.E2E_API_URL;
  if (url && url !== '') return url.replace(/\/$/, '');
  return baseUrl;
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
  const apiBase = getE2EApiUrl(baseUrl);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = overrides?.email ?? `e2e-${suffix}@example.com`;
  const password = overrides?.password ?? 'E2ETestPassword123!';
  const name = overrides?.name ?? 'E2E Test User';

  const signUpRes = await fetch(`${apiBase}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!signUpRes.ok) {
    const text = await signUpRes.text();
    throw new Error(`sign-up failed: ${signUpRes.status} ${text}`);
  }

  const signInRes = await fetch(`${apiBase}/api/auth/sign-in/email`, {
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
  const apiBase = getE2EApiUrl(baseUrl);
  await fetch(`${apiBase}/api/auth/sign-out`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
}

/**
 * 認証済みユーザーにキャラクタープロフィールを持たせる。
 * POST /api/ai/generate-character を呼ぶ。プレビュー環境の AI またはスタブが必要。
 * @returns 成功した場合 true、失敗（未スタブ・エラー）の場合 false
 */
export async function ensureUserHasProfile(baseUrl: string, cookie: string): Promise<boolean> {
  const apiBase = getE2EApiUrl(baseUrl);
  const res = await fetch(`${apiBase}/api/ai/generate-character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'E2E Test Character',
      goal: 'E2E test goal',
      genre: 'FANTASY',
    }),
  });
  return res.ok;
}
