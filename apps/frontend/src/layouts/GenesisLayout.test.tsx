/**
 * GenesisLayout の単体テスト（Task 4.1, Requirements 1.4）
 * 認証済みかつ Genesis 完了済みのとき /app へリダイレクト、
 * それ以外は Outlet を表示する。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GenesisLayout } from './GenesisLayout';
import { PATH_APP } from '@/lib/paths';

const mockUseAuth = vi.fn();
const mockUseGenesisOrProfile = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useGenesisOrProfile', () => ({
  useGenesisOrProfile: (opts: { isAuthenticated: boolean; isLoading: boolean }) =>
    mockUseGenesisOrProfile(opts),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="genesis-layout-redirect" data-to={to} />
    ),
    Outlet: () => <div data-testid="genesis-layout-outlet">Genesis outlet</div>,
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('GenesisLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseGenesisOrProfile.mockReset();
  });

  it('認証済みかつ Genesis 完了済み（dashboard）のとき /app へリダイレクトする', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseGenesisOrProfile.mockReturnValue({
      kind: 'dashboard',
      profile: { name: 'Test', goal: '', level: 1, exp: 0, maxExp: 100, hp: 100, maxHp: 100 },
    });
    renderWithRouter(<GenesisLayout />);
    const el = screen.getByTestId('genesis-layout-redirect');
    expect(el.getAttribute('data-to')).toBe(PATH_APP);
    expect(screen.queryByTestId('genesis-layout-outlet')).toBeNull();
  });

  it('認証済みかつ Genesis 未完了（genesis）のとき Outlet を表示する', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'genesis' });
    renderWithRouter(<GenesisLayout />);
    expect(screen.getByTestId('genesis-layout-outlet')).toBeTruthy();
    expect(screen.queryByTestId('genesis-layout-redirect')).toBeNull();
  });

  it('未認証のとき Outlet を表示する', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' });
    renderWithRouter(<GenesisLayout />);
    expect(screen.getByTestId('genesis-layout-outlet')).toBeTruthy();
    expect(screen.queryByTestId('genesis-layout-redirect')).toBeNull();
  });

  it('認証済みでローディング中のとき読み込み表示する', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' });
    renderWithRouter(<GenesisLayout />);
    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.queryByTestId('genesis-layout-outlet')).toBeNull();
  });
});
