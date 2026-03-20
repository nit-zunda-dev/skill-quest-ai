import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { routeConfig } from '@/routes';
import { PATH_LOGIN, PATH_ACCOUNT } from '@/lib/paths';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/LoginSignupForm', () => ({
  default: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" data-testid="login-success" onClick={() => onSuccess?.()}>
      Simulate login
    </button>
  ),
}));

const queryClient = createQueryClient();

function renderWithRouter(initialEntries: string[]) {
  const router = createMemoryRouter(routeConfig, { initialEntries, initialIndex: 0 });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe('Routing guards', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('redirects unauthenticated /account to /login with returnUrl', async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: vi.fn(),
    });
    const router = createMemoryRouter(routeConfig, { initialEntries: [PATH_ACCOUNT] });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(PATH_LOGIN);
    });
    expect(router.state.location.search).toContain('returnUrl');
    expect(router.state.location.search).toContain(encodeURIComponent(PATH_ACCOUNT));
  });

  it('shows login page at /login', async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: vi.fn(),
    });
    renderWithRouter([PATH_LOGIN]);
    expect(await screen.findByRole('heading', { name: 'Skill Quest AI' })).toBeTruthy();
  });
});
