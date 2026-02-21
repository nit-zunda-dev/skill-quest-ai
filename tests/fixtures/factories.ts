/**
 * テストデータファクトリ関数
 * テストで使用するデータオブジェクトを生成するファクトリ関数を提供
 */
import type { AuthUser } from '../../apps/backend/src/types';
import type { Task, CharacterProfile, GrimoireEntry } from '@skill-quest/shared';
import { TaskType, Difficulty } from '@skill-quest/shared';

/**
 * テストユーザーのファクトリ関数
 * @param overrides カスタマイズ可能なオプション
 * @returns テスト用の認証ユーザー
 */
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

/**
 * テストクエストのファクトリ関数
 * @param overrides カスタマイズ可能なオプション
 * @returns テスト用のタスク（クエスト）
 */
export function createTestQuest(overrides?: Partial<Task>): Task {
  const baseId = `test-quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id: baseId,
    title: 'Test Quest',
    type: TaskType.DAILY,
    difficulty: Difficulty.EASY,
    completed: false,
    ...overrides,
  };
}

/**
 * テストキャラクタープロフィールのファクトリ関数
 * @param overrides カスタマイズ可能なオプション
 * @returns テスト用のキャラクタープロフィール
 */
export function createTestCharacterProfile(overrides?: Partial<CharacterProfile>): CharacterProfile {
  return {
    name: 'Test Character',
    className: 'Warrior',
    title: 'Brave',
    prologue: 'This is a test prologue for a test character.',
    themeColor: '#6366f1',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100,
    gold: 0,
    ...overrides,
  };
}

/**
 * テストグリモワールエントリのファクトリ関数
 * @param overrides カスタマイズ可能なオプション
 * @returns テスト用のグリモワールエントリ
 */
export function createTestGrimoireEntry(overrides?: Partial<GrimoireEntry>): GrimoireEntry {
  const baseId = `test-grimoire-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return {
    id: baseId,
    date: today,
    taskTitle: 'Test Task',
    narrative: 'This is a test narrative entry.',
    rewardXp: 10,
    rewardGold: 5,
    ...overrides,
  };
}
