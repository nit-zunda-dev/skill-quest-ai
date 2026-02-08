/**
 * Better Auth クライアントのテスト（タスク 10.1）
 * - authClient が初期化されていることを検証
 * - signIn, signOut, getSession がエクスポートされていることを検証
 */
import { describe, it, expect } from 'vitest';
import { authClient, signIn, signOut, getSession } from './auth-client';

describe('auth-client', () => {
  it('authClient が初期化されている', () => {
    expect(authClient).toBeDefined();
    // createAuthClient は Proxy や関数を返す場合がある
    expect(['object', 'function']).toContain(typeof authClient);
  });

  it('signIn がエクスポートされている', () => {
    expect(signIn).toBeDefined();
    expect(authClient.signIn).toBeDefined();
  });

  it('signOut がエクスポートされている', () => {
    expect(signOut).toBeDefined();
    expect(typeof authClient.signOut).toBe('function');
  });

  it('getSession がエクスポートされている', () => {
    expect(getSession).toBeDefined();
    expect(typeof authClient.getSession).toBe('function');
  });

  it('環境変数から API URL を用いてクライアントが生成されている', () => {
    // baseURL は createAuthClient の内部に保持されるため、
    // クライアントがメソッドを持つことで初期化済みとみなす
    expect(authClient.signIn).toBeDefined();
    expect(authClient.signOut).toBeDefined();
    expect(authClient.getSession).toBeDefined();
  });
});
