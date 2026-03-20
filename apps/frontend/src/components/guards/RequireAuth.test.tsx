import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { PATH_LOGIN, PATH_ACCOUNT } from '@/lib/paths';

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

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
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}

describe('RequireAuth', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderWithRouter(
      PATH_ACCOUNT,
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('redirects to login with returnUrl when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderWithRouter(
      `${PATH_ACCOUNT}/x`,
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.queryByText('Child content')).toBeNull();
    const to = screen.getByTestId('require-auth-redirect').getAttribute('data-to');
    expect(to).toContain(PATH_LOGIN);
    expect(to).toContain('returnUrl');
    expect(to).toContain(encodeURIComponent(`${PATH_ACCOUNT}/x`));
  });

  it('falls back returnUrl to PATH_ACCOUNT for non-account paths', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderWithRouter(
      '/',
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    const to = screen.getByTestId('require-auth-redirect').getAttribute('data-to');
    expect(to).toContain(`returnUrl=${encodeURIComponent(PATH_ACCOUNT)}`);
  });

  it('shows loading state', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    renderWithRouter(
      PATH_ACCOUNT,
      <RequireAuth>
        <span>Child content</span>
      </RequireAuth>
    );
    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });
});
