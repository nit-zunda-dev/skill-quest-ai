/**
 * useSuggestQuests フックのテスト（タスク 5.2）
 * - 提案取得と採用時の一括登録を行うことを検証
 * - ローディング・エラー状態を扱うことを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSuggestQuests } from './useSuggestQuests';
import { TaskType, Difficulty, Genre } from '@skill-quest/shared';
import type { SuggestedQuestItem } from '@skill-quest/shared';

const mockSuggestions: SuggestedQuestItem[] = [
  { title: '単語を覚える', type: TaskType.SKILL, difficulty: Difficulty.EASY },
  { title: 'リスニング練習', type: TaskType.SKILL, difficulty: Difficulty.MEDIUM },
];

const mockSuggestQuests = vi.fn();
const mockCreateQuestsBatch = vi.fn();

vi.mock('@/lib/api-client', () => ({
  suggestQuests: (req: { goal: string; genre?: Genre }) => mockSuggestQuests(req),
  createQuestsBatch: (req: { quests: SuggestedQuestItem[] }) => mockCreateQuestsBatch(req),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useSuggestQuests', () => {
  beforeEach(() => {
    mockSuggestQuests.mockReset();
    mockCreateQuestsBatch.mockReset();
  });

  it('fetchSuggestions と adoptQuests を返す', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });
    expect(typeof result.current.fetchSuggestions).toBe('function');
    expect(typeof result.current.adoptQuests).toBe('function');
  });

  it('提案取得成功時に suggestions がセットされローディングが解除される', async () => {
    mockSuggestQuests.mockResolvedValue(mockSuggestions);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });

    result.current.fetchSuggestions({ goal: '英語力を上げる' });

    await waitFor(() => {
      expect(result.current.isFetchingSuggestions).toBe(false);
    });
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(mockSuggestQuests).toHaveBeenCalledWith({ goal: '英語力を上げる' });
  });

  it('提案取得中は isFetchingSuggestions が true である', async () => {
    let resolve: (v: SuggestedQuestItem[]) => void;
    mockSuggestQuests.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });

    result.current.fetchSuggestions({ goal: '目標' });
    await waitFor(() => {
      expect(result.current.isFetchingSuggestions).toBe(true);
    });

    resolve!(mockSuggestions);
    await waitFor(() => {
      expect(result.current.isFetchingSuggestions).toBe(false);
    });
  });

  it('提案取得失敗時に suggestError がセットされる', async () => {
    mockSuggestQuests.mockRejectedValue(new Error('AI generation failed'));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });

    result.current.fetchSuggestions({ goal: '目標' });

    await waitFor(() => {
      expect(result.current.suggestError).toBeDefined();
    });
    expect(result.current.suggestError?.message).toContain('AI generation failed');
  });

  it('採用成功時に createQuestsBatch を呼び invalidate する', async () => {
    const created = [
      { id: 'id-1', title: '単語を覚える', type: TaskType.SKILL, difficulty: Difficulty.EASY, completed: false },
    ];
    mockCreateQuestsBatch.mockResolvedValue(created);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });

    result.current.adoptQuests({ quests: mockSuggestions });

    await waitFor(() => {
      expect(result.current.isAdopting).toBe(false);
    });
    expect(mockCreateQuestsBatch).toHaveBeenCalledWith({ quests: mockSuggestions });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['quests'] });
  });

  it('採用中は isAdopting が true である', async () => {
    let resolve: (v: unknown) => void;
    mockCreateQuestsBatch.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });

    result.current.adoptQuests({ quests: mockSuggestions });
    await waitFor(() => {
      expect(result.current.isAdopting).toBe(true);
    });

    resolve!([]);
    await waitFor(() => {
      expect(result.current.isAdopting).toBe(false);
    });
  });

  it('採用失敗時に adoptError がセットされる', async () => {
    mockCreateQuestsBatch.mockRejectedValue(new Error('一括作成に失敗しました'));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSuggestQuests(), { wrapper });

    result.current.adoptQuests({ quests: mockSuggestions });

    await waitFor(() => {
      expect(result.current.adoptError).toBeDefined();
    });
    expect(result.current.adoptError?.message).toContain('一括作成に失敗しました');
  });
});
