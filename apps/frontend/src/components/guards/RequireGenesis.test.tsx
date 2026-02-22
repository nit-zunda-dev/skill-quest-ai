/**
 * RequireGenesis ガードの単体テスト（Task 3.1, 14.1）
 * 認証済みかつ Genesis 完了済みなら子要素を描画、
 * Genesis 未完了なら /genesis へリダイレクト、ローディング・エラー時は既存方針の表示。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireGenesis } from './RequireGenesis';
import { PATH_GENESIS } from '@/lib/paths';

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
      <div data-testid="require-genesis-redirect" data-to={to} />
    ),
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('RequireGenesis', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseGenesisOrProfile.mockReset();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
  });

  it('Genesis 完了済み（dashboard）のとき子要素を描画する', () => {
    mockUseGenesisOrProfile.mockReturnValue({
      kind: 'dashboard',
      profile: { name: 'Test', goal: '', level: 1, exp: 0, maxExp: 100, hp: 100, maxHp: 100 },
    });
    renderWithRouter(
      <RequireGenesis>
        <span>Child content</span>
      </RequireGenesis>
    );
    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('Genesis 未完了（genesis）のとき /genesis へリダイレクトする', () => {
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'genesis' });
    renderWithRouter(
      <RequireGenesis>
        <span>Child content</span>
      </RequireGenesis>
    );
    expect(screen.queryByText('Child content')).toBeNull();
    const el = screen.getByTestId('require-genesis-redirect');
    expect(el.getAttribute('data-to')).toBe(PATH_GENESIS);
  });

  it('ローディング中は読み込み表示をし、子は描画しない', () => {
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' });
    renderWithRouter(
      <RequireGenesis>
        <span>Child content</span>
      </RequireGenesis>
    );
    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.queryByText('Child content')).toBeNull();
  });

  it('エラー時はメッセージを表示し、子は描画しない', () => {
    mockUseGenesisOrProfile.mockReturnValue({
      kind: 'error',
      message: 'キャラクター情報の取得に失敗しました。',
    });
    renderWithRouter(
      <RequireGenesis>
        <span>Child content</span>
      </RequireGenesis>
    );
    expect(screen.getByText('キャラクター情報の取得に失敗しました。')).toBeTruthy();
    expect(screen.queryByText('Child content')).toBeNull();
  });

  it('(Task 10.2) location.state に fromGenesis と profile があるときは /genesis へリダイレクトせず子を描画する', () => {
    const stateProfile = {
      name: 'Test',
      className: 'A',
      title: 'B',
      prologue: 'P',
      themeColor: '#',
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      gold: 0,
    };
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'genesis' });
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/app', state: { fromGenesis: true, profile: stateProfile } }]}
      >
        <RequireGenesis>
          <span>Child content</span>
        </RequireGenesis>
      </MemoryRouter>
    );
    expect(screen.getByText('Child content')).toBeTruthy();
    expect(screen.queryByTestId('require-genesis-redirect')).toBeNull();
  });
});
