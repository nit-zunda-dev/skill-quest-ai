/**
 * useProfile フックのテスト（タスク 8.4）
 * - useQuery でプロフィールを取得することを検証
 * - useMutation でプロフィールを更新することを検証
 * - ローディング・エラー状態を扱うことを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProfile } from './useProfile';

const mockProfile = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  image: null as string | null,
};

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      profile: {
        $get: vi.fn(),
        $patch: vi.fn(),
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

describe('useProfile', () => {
  beforeEach(async () => {
    const { client } = await import('@/lib/client');
    const mockGet = client.api.profile.$get as ReturnType<typeof vi.fn>;
    mockGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    });
    const mockPatch = client.api.profile.$patch as ReturnType<typeof vi.fn>;
    mockPatch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockProfile, name: 'Updated Name' }),
    });
  });

  it('useQuery でプロフィールを取得する', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockProfile);
    expect(result.current.isError).toBe(false);
  });

  it('ローディング中は isLoading が true である', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('エラー時は isError が true かつ error が設定される', async () => {
    const { client } = await import('@/lib/client');
    const mockGet = client.api.profile.$get as ReturnType<typeof vi.fn>;
    mockGet.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('useMutation でプロフィールを更新する', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.updateProfile({ name: 'Updated Name' });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const { client } = await import('@/lib/client');
    const mockPatch = client.api.profile.$patch as ReturnType<typeof vi.fn>;
    expect(mockPatch).toHaveBeenCalledWith({
      json: { name: 'Updated Name' },
    });
  });
});
