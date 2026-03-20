/**
 * テストデータファクトリ（フェーズ1: 認証ユーザー中心）
 */
import type { AuthUser } from '../../apps/backend/src/types';

export function createTestUser(overrides?: Partial<AuthUser>): AuthUser {
  const baseId = `test-user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id: baseId,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    image: null,
    ...overrides,
  };
}
