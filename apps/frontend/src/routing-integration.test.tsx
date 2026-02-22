/**
 * ルーティング・ガードの統合テスト（Task 14.2, Requirements 4.1, 4.2）
 * 未認証で /app アクセス時の /login リダイレクトと returnUrl、
 * ログイン成功後の returnUrl 遷移、Genesis 未完了で /app アクセス時の /genesis リダイレクトを検証する。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { routeConfig } from '@/routes';
import { PATH_LOGIN, PATH_GENESIS, PATH_APP } from '@/lib/paths';

const mockUseAuth = vi.fn();
const mockUseGenesisOrProfile = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useGenesisOrProfile', () => ({
  useGenesisOrProfile: (opts: { isAuthenticated: boolean; isLoading: boolean }) =>
    mockUseGenesisOrProfile(opts),
}));

vi.mock('@/components/LoginSignupForm', () => ({
  default: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" data-testid="login-success" onClick={() => onSuccess?.()}>
      Simulate login
    </button>
  ),
}));

const queryClient = createQueryClient();

function createRouter(initialEntries: string[]) {
  return createMemoryRouter(routeConfig, { initialEntries, initialIndex: 0 });
}

function renderWithRouter(router: ReturnType<typeof createMemoryRouter>) {
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe('Routing guards integration (Task 14.2)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseGenesisOrProfile.mockReset();
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' as const });
  });

  it('未認証で /app にアクセスしたとき /login へリダイレクトし returnUrl を付与する', async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: vi.fn(),
    });
    const router = createRouter(['/app']);
    renderWithRouter(router);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(PATH_LOGIN);
    });
    expect(router.state.location.search).toContain('returnUrl');
    expect(router.state.location.search).toContain(encodeURIComponent(PATH_APP));
  });

  it('Genesis 未完了で /app にアクセスしたとき /genesis へリダイレクトする', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { name: 'Test' } },
      isLoading: false,
      isAuthenticated: true,
      refetch: vi.fn(),
    });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'genesis' as const });
    const router = createRouter(['/app']);
    renderWithRouter(router);

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(new RegExp(`^${PATH_GENESIS}(/|$)`));
    });
  });

  it('ログイン成功後に有効な returnUrl があればその URL へ遷移する', async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: vi.fn(),
    });
    const router = createRouter(['/login?returnUrl=%2Fapp%2Fquests']);
    const navigateSpy = vi.spyOn(router, 'navigate');
    renderWithRouter(router);

    const btn = await screen.findByTestId('login-success');
    await act(async () => {
      btn.click();
    });

    expect(navigateSpy).toHaveBeenCalledWith('/app/quests', expect.any(Object));
    navigateSpy.mockRestore();
  });
});
