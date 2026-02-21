/**
 * API クライアントのテスト（タスク 5.1: 提案取得・目標更新・クエスト一括作成）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Difficulty, TaskType } from '@skill-quest/shared';
import {
  suggestQuests,
  updateGoal,
  createQuestsBatch,
} from './api-client';

const mockSuggestPost = vi.fn();
const mockGoalPatch = vi.fn();
const mockBatchPost = vi.fn();

vi.mock('./client', () => ({
  client: {
    api: {
      ai: {
        'suggest-quests': { $post: (opts: { json: unknown }) => mockSuggestPost(opts) },
        goal: { $patch: (opts: { json: unknown }) => mockGoalPatch(opts) },
      },
      quests: {
        batch: { $post: (opts: { json: unknown }) => mockBatchPost(opts) },
      },
    },
  },
}));

describe('suggestQuests', () => {
  beforeEach(() => {
    mockSuggestPost.mockReset();
  });

  it('目標を渡すと POST /api/ai/suggest-quests を呼び出し suggestions を返す', async () => {
    const expected = [
      { title: '単語を覚える', type: TaskType.SKILL, difficulty: Difficulty.EASY },
      { title: 'リスニング練習', type: TaskType.SKILL, difficulty: Difficulty.MEDIUM },
    ];
    mockSuggestPost.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: expected }),
    });

    const result = await suggestQuests({ goal: '英語力を上げる' });

    expect(mockSuggestPost).toHaveBeenCalledWith({ json: { goal: '英語力を上げる' } });
    expect(result).toEqual(expected);
  });

  it('400 のときエラーをスローする', async () => {
    mockSuggestPost.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid or unsafe input', reason: 'too_short' }),
    });
    await expect(suggestQuests({ goal: 'x' })).rejects.toThrow();
  });

  it('500/502 のときエラーをスローする', async () => {
    mockSuggestPost.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ message: 'しばらく経ってから再試行してください。' }),
    });
    await expect(suggestQuests({ goal: '目標' })).rejects.toThrow();
  });
});

describe('updateGoal', () => {
  beforeEach(() => {
    mockGoalPatch.mockReset();
  });

  it('目標を渡すと PATCH /api/ai/goal を呼び出し void で完了する', async () => {
    mockGoalPatch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    await expect(updateGoal({ goal: '新しい目標' })).resolves.toBeUndefined();
    expect(mockGoalPatch).toHaveBeenCalledWith({ json: { goal: '新しい目標' } });
  });

  it('429 のときエラーをスローする', async () => {
    mockGoalPatch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({ error: 'Too Many Requests', message: '本日は目標の変更回数（2回）に達しています。' }),
    });
    await expect(updateGoal({ goal: '目標' })).rejects.toThrow();
  });
});

describe('createQuestsBatch', () => {
  beforeEach(() => {
    mockBatchPost.mockReset();
  });

  it('クエスト配列を渡すと POST /api/quests/batch を呼び出し作成済みクエスト一覧を返す', async () => {
    const quests = [
      { title: 'タスク1', type: TaskType.SKILL, difficulty: Difficulty.EASY },
      { title: 'タスク2', type: TaskType.STORY, difficulty: Difficulty.MEDIUM },
    ];
    const created = [
      {
        id: 'id-1',
        title: 'タスク1',
        type: TaskType.SKILL,
        difficulty: Difficulty.EASY,
        completed: false,
      },
      {
        id: 'id-2',
        title: 'タスク2',
        type: TaskType.STORY,
        difficulty: Difficulty.MEDIUM,
        completed: false,
      },
    ];
    mockBatchPost.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await createQuestsBatch({ quests });

    expect(mockBatchPost).toHaveBeenCalledWith({ json: { quests } });
    expect(result).toEqual(created);
  });

  it('400 のときエラーをスローする', async () => {
    mockBatchPost.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Validation error' }),
    });
    await expect(
      createQuestsBatch({
        quests: [{ title: '', type: TaskType.SKILL, difficulty: Difficulty.EASY }],
      })
    ).rejects.toThrow();
  });
});
