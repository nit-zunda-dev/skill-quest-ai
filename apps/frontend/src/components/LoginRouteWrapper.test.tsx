/**
 * LoginRouteWrapper の単体テスト（Task 5.1, Requirements 4.1 / Task 12.1, 5.3）
 * 認証成功後に returnUrl が有効ならその URL へ、無効または無ければダッシュボードへ遷移する。
 * クエリ mode / returnUrl の正規化を検証する。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginRouteWrapper } from './LoginRouteWrapper';
import { PATH_APP } from '@/lib/paths';

const mockNavigate = vi.fn();
const mockRefetch = vi.fn();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  const realUseSearchParams = mod.useSearchParams;
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useSearchParams: () => {
      const [params, setSearchParams] = realUseSearchParams();
      return [params, mockSetSearchParams];
    },
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ refetch: mockRefetch }),
}));

vi.mock('@/components/LoginSignupForm', () => ({
  default: ({
    onSuccess,
    initialMode,
  }: {
    onSuccess?: () => void;
    initialMode?: 'login' | 'signup';
  }) => (
    <>
      <span data-testid="initial-mode">{initialMode ?? 'login'}</span>
      <button type="button" data-testid="simulate-success" onClick={() => onSuccess?.()}>
        Simulate success
      </button>
    </>
  ),
}));

function renderWithRouter(initialEntry: string, ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      {ui}
    </MemoryRouter>
  );
}

describe('LoginRouteWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LoginSignupForm を表示する', () => {
    renderWithRouter('/login', <LoginRouteWrapper />);
    expect(screen.getByTestId('simulate-success')).toBeTruthy();
  });

  it('認証成功時に有効な returnUrl があればその URL へ遷移する', () => {
    renderWithRouter('/login?returnUrl=%2Fapp%2Fquests', <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/app/quests');
  });

  it('認証成功時に returnUrl が無効なら PATH_APP へ遷移する', () => {
    renderWithRouter('/login?returnUrl=%2Fother', <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockNavigate).toHaveBeenCalledWith(PATH_APP);
  });

  it('認証成功時に returnUrl が無ければ PATH_APP へ遷移する', () => {
    renderWithRouter('/login', <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockNavigate).toHaveBeenCalledWith(PATH_APP);
  });

  it('認証成功時に returnUrl が /app なら /app へ遷移する', () => {
    renderWithRouter('/login?returnUrl=%2Fapp', <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockNavigate).toHaveBeenCalledWith(PATH_APP);
  });

  describe('Task 12.1: クエリ・ハッシュの正規化 (Req 5.3)', () => {
    it('mode=signup のときフォームに initialMode=signup を渡す', () => {
      renderWithRouter('/login?mode=signup', <LoginRouteWrapper />);
      expect(screen.getByTestId('initial-mode').textContent).to.equal('signup');
    });

    it('mode=invalid のとき initialMode=login をデフォルトとする', () => {
      renderWithRouter('/login?mode=invalid', <LoginRouteWrapper />);
      expect(screen.getByTestId('initial-mode').textContent).to.equal('login');
    });

    it('mode が欠落しているとき initialMode=login を渡す', () => {
      renderWithRouter('/login', <LoginRouteWrapper />);
      expect(screen.getByTestId('initial-mode').textContent).to.equal('login');
    });

    it('returnUrl が無効なときマウント時に URL を正規化する（setSearchParams を呼ぶ）', () => {
      renderWithRouter('/login?returnUrl=http%3A%2F%2Fevil.com', <LoginRouteWrapper />);
      expect(mockSetSearchParams).toHaveBeenCalled();
      const setSearchParamsArg = mockSetSearchParams.mock.calls[0][0];
      if (typeof setSearchParamsArg === 'function') {
        const prev = new URLSearchParams('returnUrl=http%3A%2F%2Fevil.com');
        const next = setSearchParamsArg(prev);
        expect(next.get('returnUrl')).toBeFalsy();
      } else {
        expect(setSearchParamsArg.get?.('returnUrl')).toBeFalsy();
      }
    });
  });
});
