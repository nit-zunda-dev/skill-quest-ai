/**
 * E2E テスト用セットアップ
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

export function getE2EBaseUrl(): string | undefined {
  const url = process.env.E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
  if (!url || url === '') return undefined;
  return url.replace(/\/$/, '');
}

export function getE2EApiUrl(baseUrl: string): string {
  const url = process.env.E2E_API_URL;
  if (url && url !== '') return url.replace(/\/$/, '');
  return baseUrl;
}

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

export async function cleanupTestData(baseUrl: string, cookie: string): Promise<void> {
  const apiBase = getE2EApiUrl(baseUrl);
  await fetch(`${apiBase}/api/auth/sign-out`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
}
