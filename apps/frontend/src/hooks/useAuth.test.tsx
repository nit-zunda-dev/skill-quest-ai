/**
 * useAuth フックのテスト（タスク 10.3）
 * - アプリ起動時に getSession が呼ばれることを検証
 * - セッションありで isAuthenticated が true になることを検証
 * - セッションなしで isAuthenticated が false になることを検証
 * - signOut 呼び出しで authClient.signOut が呼ばれセッションがクリアされることを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from './useAuth';

const mockSession = {
  user: { id: 'u1', email: 'u@ex.com', name: 'User' },
  session: { id: 's1', token: 't1', expiresAt: 0 },
};

const mockGetSession = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe('useAuth', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockSignOut.mockReset();
  });

  it('マウント時に getSession が呼ばれる', async () => {
    mockGetSession.mockResolvedValue({ data: null });
    renderHook(() => useAuth());
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });
  });

  it('getSession がセッションを返すと isAuthenticated が true になる', async () => {
    mockGetSession.mockResolvedValue({ data: mockSession });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.session).toEqual(mockSession);
  });

  it('getSession が null を返すと isAuthenticated が false になる', async () => {
    mockGetSession.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it('signOut を呼ぶと authClient.signOut が呼ばれセッションがクリアされる', async () => {
    mockGetSession.mockResolvedValue({ data: mockSession });
    mockSignOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
