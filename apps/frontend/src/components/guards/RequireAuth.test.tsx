/**
 * RequireAuth ガードの単体テスト（Task 2.1, 2.2, 14.1）
 * 認証済みなら子要素を描画、未認証なら /login へリダイレクト（returnUrl 付与）、ローディング中は読み込み表示。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { PATH_LOGIN } from '@/lib/paths';

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Navigate の to を検証するため、テスト用にモック（実装は DOM を描画しない）
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="require-auth-redirect" data-to={to} />
    ),
  };
});

function renderWithRouter(initialPath: string, ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {ui}
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('認証済みのとき子要素を描画する', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    renderWithRouter(
      '/app/quests',
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('未認証のとき /login へリダイレクトする（子は表示されない）', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    renderWithRouter(
      '/app/quests',
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.queryByText('Child content')).toBeNull();
    const to = screen.getByTestId('require-auth-redirect').getAttribute('data-to');
    expect(to).toContain(PATH_LOGIN);
    expect(to).toContain('returnUrl');
    expect(to).toContain(encodeURIComponent('/app/quests'));
  });

  it('未認証でパスがアプリ外のとき returnUrl は /app にフォールバックする', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    renderWithRouter(
      '/',
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.queryByText('Child content')).toBeNull();
    const to = screen.getByTestId('require-auth-redirect').getAttribute('data-to');
    expect(to).toContain('returnUrl=%2Fapp');
  });

  it('ローディング中は読み込み表示をし、子は描画しない', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    renderWithRouter(
      '/app',
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.queryByText('Child content')).toBeNull();
  });
});
