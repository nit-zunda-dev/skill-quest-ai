/**
 * useGrimoire フックのテスト
 * - useQuery でグリモワール一覧を取得することを検証
 * - generateGrimoire のmutationを検証
 * - ローディング・エラー状態を扱うことを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGrimoire } from './useGrimoire';
import { createTestGrimoireEntry } from '../../../../tests/fixtures';

const mockGrimoireEntries = [
  createTestGrimoireEntry({
    id: 'g1',
    taskTitle: 'Test Task 1',
    narrative: 'Test narrative 1',
    rewardXp: 10,
    rewardGold: 5,
  }),
  createTestGrimoireEntry({
    id: 'g2',
    taskTitle: 'Test Task 2',
    narrative: 'Test narrative 2',
    rewardXp: 15,
    rewardGold: 10,
  }),
];

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      grimoire: {
        $get: vi.fn(),
        generate: {
          $post: vi.fn(),
        },
      },
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useGrimoire', () => {
  beforeEach(async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockGet = client.api.grimoire.$get as ReturnType<typeof vi.fn>;
    mockGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGrimoireEntries),
    });
  });

  it('useQuery でグリモワール一覧を取得する', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockGrimoireEntries);
    expect(result.current.isError).toBe(false);
  });

  it('ローディング中は isLoading が true である', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('エラー時は isError が true かつ error が設定される', async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockGet = client.api.grimoire.$get as ReturnType<typeof vi.fn>;
    mockGet.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('generateGrimoire 関数を返す', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.generateGrimoire).toBe('function');
  });

  it('generateGrimoire を呼び出すとAPIが呼ばれる', async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockPost = client.api.grimoire.generate.$post as ReturnType<typeof vi.fn>;
    const mockResult = {
      grimoireEntry: createTestGrimoireEntry({ id: 'g3' }),
      profile: { level: 2 },
      oldProfile: { level: 1 },
    };
    mockPost.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.generateGrimoire();

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
  });

  it('generateGrimoire 実行中は isGenerating が true である', async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockPost = client.api.grimoire.generate.$post as ReturnType<typeof vi.fn>;
    mockPost.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ grimoireEntry: createTestGrimoireEntry() }),
    }), 100)));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.generateGrimoire();

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
    });
  });

  it('generateGrimoire エラー時は generateError が設定される', async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockPost = client.api.grimoire.generate.$post as ReturnType<typeof vi.fn>;
    mockPost.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Generation failed' }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.generateGrimoire();

    await waitFor(() => {
      expect(result.current.generateError).toBeDefined();
    });
  });

  it('generateGrimoire 成功後、グリモワール一覧が再取得される', async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockGet = client.api.grimoire.$get as ReturnType<typeof vi.fn>;
    const mockPost = client.api.grimoire.generate.$post as ReturnType<typeof vi.fn>;
    mockPost.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ grimoireEntry: createTestGrimoireEntry({ id: 'g3' }) }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockGet.mock.calls.length;
    result.current.generateGrimoire();

    await waitFor(() => {
      expect(mockGet.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('invalidate 関数を返す', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.invalidate).toBe('function');
  });

  it('invalidate を呼び出すとクエリが無効化される', async () => {
    const { client } = await import('@/lib/client') as {
      client: {
        api: {
          grimoire: {
            $get: ReturnType<typeof vi.fn>;
            generate: { $post: ReturnType<typeof vi.fn> };
          };
        };
      };
    };
    const mockGet = client.api.grimoire.$get as ReturnType<typeof vi.fn>;

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGrimoire(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockGet.mock.calls.length;
    result.current.invalidate();

    await waitFor(() => {
      expect(mockGet.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});
