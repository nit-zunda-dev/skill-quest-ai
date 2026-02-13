/**
 * useGenesisOrProfile フックのテスト
 * - 認証状態に応じた状態遷移を検証
 * - キャラクター生成済み/未生成の状態を検証
 * - エラー状態を検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGenesisOrProfile } from './useGenesisOrProfile';
import { createTestCharacterProfile } from '../../../../tests/fixtures';
import * as useAiUsageModule from '@/hooks/useAiUsage';
import * as apiClientModule from '@/lib/api-client';

const mockUseAiUsage = vi.fn();
const mockGetCharacterProfile = vi.fn();

vi.mock('@/hooks/useAiUsage', () => ({
  useAiUsage: (...args: unknown[]) => mockUseAiUsage(...args),
}));

vi.mock('@/lib/api-client', () => ({
  getCharacterProfile: (...args: unknown[]) => mockGetCharacterProfile(...args),
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

describe('useGenesisOrProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証中の場合、loading状態を返す', () => {
    mockUseAiUsage.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: false, isLoading: true }),
      { wrapper }
    );

    expect(result.current.kind).toBe('loading');
  });

  it('未認証の場合、loading状態を返す', () => {
    mockUseAiUsage.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: false, isLoading: false }),
      { wrapper }
    );

    expect(result.current.kind).toBe('loading');
  });

  it('AI利用状況取得中の場合、loading状態を返す', () => {
    mockUseAiUsage.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    expect(result.current.kind).toBe('loading');
  });

  it('AI利用状況取得エラー時、genesis状態を返す', () => {
    mockUseAiUsage.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    expect(result.current.kind).toBe('genesis');
  });

  it('キャラクター未生成の場合、genesis状態を返す', () => {
    mockUseAiUsage.mockReturnValue({
      data: { characterGenerated: false },
      isLoading: false,
      isError: false,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    expect(result.current.kind).toBe('genesis');
  });

  it('キャラクター生成済みでプロフィール取得中の場合、loading状態を返す', async () => {
    mockUseAiUsage.mockReturnValue({
      data: { characterGenerated: true },
      isLoading: false,
      isError: false,
    });

    mockGetCharacterProfile.mockImplementation(() => new Promise(() => {}));

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.kind).toBe('loading');
    });
  });

  it('キャラクター生成済みでプロフィール取得成功時、dashboard状態を返す', async () => {
    mockUseAiUsage.mockReturnValue({
      data: { characterGenerated: true },
      isLoading: false,
      isError: false,
    });

    const profile = createTestCharacterProfile();
    mockGetCharacterProfile.mockResolvedValue(profile);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.kind).toBe('dashboard');
    });

    if (result.current.kind === 'dashboard') {
      expect(result.current.profile).toEqual(profile);
    }
  });

  it('プロフィール取得エラー時、error状態を返す', async () => {
    mockUseAiUsage.mockReturnValue({
      data: { characterGenerated: true },
      isLoading: false,
      isError: false,
    });

    mockGetCharacterProfile.mockRejectedValue(new Error('Failed to fetch'));

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.kind).toBe('error');
    });

    if (result.current.kind === 'error') {
      expect(result.current.message).toBe('キャラクター情報の取得に失敗しました。');
    }
  });

  it('プロフィールがnullの場合、error状態を返す', async () => {
    mockUseAiUsage.mockReturnValue({
      data: { characterGenerated: true },
      isLoading: false,
      isError: false,
    });

    mockGetCharacterProfile.mockResolvedValue(null);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.kind).toBe('error');
    });

    if (result.current.kind === 'error') {
      expect(result.current.message).toBe('キャラクター情報の取得に失敗しました。');
    }
  });

  it('キャラクター未生成時はプロフィール取得をスキップする', async () => {
    mockUseAiUsage.mockReturnValue({
      data: { characterGenerated: false },
      isLoading: false,
      isError: false,
    });

    const wrapper = createWrapper();
    renderHook(
      () => useGenesisOrProfile({ isAuthenticated: true, isLoading: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockGetCharacterProfile).not.toHaveBeenCalled();
    });
  });
});
