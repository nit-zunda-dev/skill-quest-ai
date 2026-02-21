/**
 * LoginRouteWrapper の単体テスト（Task 5.1, Requirements 4.1）
 * 認証成功後に returnUrl が有効ならその URL へ、無効または無ければダッシュボードへ遷移する。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginRouteWrapper } from './LoginRouteWrapper';
import { PATH_APP } from '@/lib/paths';

const mockNavigate = vi.fn();
const mockRefetch = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ refetch: mockRefetch }),
}));

vi.mock('@/components/LoginSignupForm', () => ({
  default: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" data-testid="simulate-success" onClick={() => onSuccess?.()}>
      Simulate success
    </button>
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
});
