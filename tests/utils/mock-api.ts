/**
 * APIクライアントのモック関数
 * テストで使用するAPIクライアントのモックを提供
 */
import type { vi } from 'vitest';

/**
 * Hono RPCクライアントのモック型
 */
export interface MockHonoClient {
  api: {
    [key: string]: {
      [method: string]: ReturnType<typeof vi.fn>;
    };
  };
}

/**
 * APIクライアントのモックを作成
 * @param overrides カスタマイズ可能なオプション
 * @returns APIクライアントのモック
 */
export function createMockAPIClient(overrides?: Partial<MockHonoClient>): MockHonoClient {
  return {
    api: {
      ...overrides?.api,
    },
  };
}

/**
 * Better Authクライアントのモック型
 */
export interface MockAuthClient {
  signIn: {
    email: ReturnType<typeof vi.fn>;
  };
  signUp: {
    email: ReturnType<typeof vi.fn>;
  };
  signOut: ReturnType<typeof vi.fn>;
  getSession: ReturnType<typeof vi.fn>;
}

/**
 * Better Authクライアントのモックを作成
 * @param overrides カスタマイズ可能なオプション
 * @returns Better Authクライアントのモック
 */
export function createMockAuthClient(overrides?: Partial<MockAuthClient>): MockAuthClient {
  return {
    signIn: {
      email: overrides?.signIn?.email ?? (() => Promise.resolve({ data: {}, error: null })),
    },
    signUp: {
      email: overrides?.signUp?.email ?? (() => Promise.resolve({ data: {}, error: null })),
    },
    signOut: overrides?.signOut ?? (() => Promise.resolve()),
    getSession: overrides?.getSession ?? (() => Promise.resolve({ data: { user: null }, error: null })),
  };
}
