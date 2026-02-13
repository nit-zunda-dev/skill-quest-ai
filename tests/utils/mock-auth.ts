/**
 * 認証のモック関数
 * テストで使用する認証関連のモックを提供
 */
import type { AuthUser } from '../../apps/backend/src/types';

/**
 * デフォルトのテストユーザー
 */
export const DEFAULT_TEST_USER: AuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

/**
 * テスト用の認証ユーザーを作成
 * @param overrides カスタマイズ可能なオプション
 * @returns 認証ユーザーのモック
 */
export function createMockAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    ...DEFAULT_TEST_USER,
    ...overrides,
  };
}

/**
 * 認証コンテキストのモック（HonoのVariablesに設定する用）
 */
export interface AuthContext {
  user: AuthUser;
}

/**
 * 認証コンテキストを作成
 * @param user 認証ユーザー（省略時はデフォルトユーザー）
 * @returns 認証コンテキスト
 */
export function createMockAuthContext(user?: AuthUser): AuthContext {
  return {
    user: user ?? DEFAULT_TEST_USER,
  };
}
