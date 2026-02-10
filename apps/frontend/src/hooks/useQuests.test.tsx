/**
 * useQuests フックのテスト（タスク 8.3）
 * - useQuery でクエスト一覧を取得することを検証
 * - ローディング・エラー状態を扱うことを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useQuests } from './useQuests';

const mockQuests = [
  {
    id: 'q1',
    title: 'Test Quest',
    type: 'TODO',
    difficulty: 'EASY',
    completed: false,
    streak: 0,
    status: 'todo',
  },
];

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      quests: {
        $get: vi.fn(),
      },
    },
  },
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

describe('useQuests', () => {
  beforeEach(async () => {
    const { client } = await import('@/lib/client');
    const mockGet = client.api.quests.$get as ReturnType<typeof vi.fn>;
    mockGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockQuests),
    });
  });

  it('useQuery でクエスト一覧を取得する', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useQuests(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockQuests);
    expect(result.current.isError).toBe(false);
  });

  it('ローディング中は isLoading が true である', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useQuests(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('エラー時は isError が true かつ error が設定される', async () => {
    const { client } = await import('@/lib/client');
    const mockGet = client.api.quests.$get as ReturnType<typeof vi.fn>;
    mockGet.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useQuests(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('addQuest と deleteQuest を返す（タスク 8.5）', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useQuests(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.addQuest).toBe('function');
    expect(typeof result.current.deleteQuest).toBe('function');
  });
});
