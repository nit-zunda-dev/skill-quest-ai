import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginRouteWrapper } from './LoginRouteWrapper';
import { PATH_ACCOUNT, PATH_LANDING } from '@/lib/paths';

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
  return render(<MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>);
}

describe('LoginRouteWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders LoginSignupForm', () => {
    renderWithRouter('/login', <LoginRouteWrapper />);
    expect(screen.getByTestId('simulate-success')).toBeTruthy();
  });

  it('navigates to valid returnUrl under /account', () => {
    renderWithRouter(`/login?returnUrl=${encodeURIComponent('/account')}`, <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(PATH_ACCOUNT);
  });

  it('navigates to PATH_ACCOUNT when returnUrl is invalid', () => {
    renderWithRouter('/login?returnUrl=%2Fother', <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockNavigate).toHaveBeenCalledWith(PATH_ACCOUNT);
  });

  it('navigates to PATH_ACCOUNT when returnUrl is missing', () => {
    renderWithRouter('/login', <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockNavigate).toHaveBeenCalledWith(PATH_ACCOUNT);
  });

  it('allows returnUrl / (landing)', () => {
    renderWithRouter(`/login?returnUrl=${encodeURIComponent('/')}`, <LoginRouteWrapper />);
    fireEvent.click(screen.getByTestId('simulate-success'));
    expect(mockNavigate).toHaveBeenCalledWith(PATH_LANDING);
  });

  describe('query normalization', () => {
    it('passes initialMode signup when mode=signup', () => {
      renderWithRouter('/login?mode=signup', <LoginRouteWrapper />);
      expect(screen.getByTestId('initial-mode').textContent).toBe('signup');
    });

    it('defaults to login for invalid mode', () => {
      renderWithRouter('/login?mode=invalid', <LoginRouteWrapper />);
      expect(screen.getByTestId('initial-mode').textContent).toBe('login');
    });

    it('calls setSearchParams when returnUrl is invalid external', () => {
      renderWithRouter('/login?returnUrl=http%3A%2F%2Fevil.com', <LoginRouteWrapper />);
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });
});
