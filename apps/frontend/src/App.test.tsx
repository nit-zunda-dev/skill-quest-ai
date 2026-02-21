/**
 * App 未認証分岐のテスト（Task 3.1, 5.2）
 * - フォーム表示フラグが偽のときランディングが表示される（Task 5.2, Req 1.3, 5.3）
 * - フォーム表示フラグが真のときログイン/サインアップフォームが表示される（Task 5.2）
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { createQueryClient } from '@/lib/query';
import { QueryClientProvider } from '@tanstack/react-query';

const mockRefetch = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: null,
    isLoading: false,
    isAuthenticated: false,
    refetch: mockRefetch,
  }),
}));

vi.mock('@/hooks/useGenesisOrProfile', () => ({
  useGenesisOrProfile: () => ({ kind: 'loading' as const }),
}));

const queryClient = createQueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('App unauthenticated branch (Task 3.1, 5.2)', () => {
  beforeEach(() => {
    mockRefetch.mockClear();
  });

  it('shows landing when form flag is false; shows login/signup form when true (Task 5.2)', () => {
    render(<App />, { wrapper });
    expect(screen.getByTestId('landing-page')).toBeTruthy();
    expect(screen.queryByPlaceholderText('メール')).toBeNull();

    const cta = screen.getByRole('button', { name: /始める/ });
    fireEvent.click(cta);
    expect(screen.getByPlaceholderText('メール')).toBeTruthy();
    expect(screen.queryByTestId('landing-page')).toBeNull();
  });
});

describe('Landing CTA switches to form (Task 3.2, Req 5.1, 5.3)', () => {
  it('clicking landing primary CTA sets form flag and shows login/signup form', () => {
    render(<App />, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
      ),
    });
    expect(screen.getByTestId('landing-page')).toBeTruthy();
    const cta = screen.getByRole('button', { name: '冒険を始める' });
    fireEvent.click(cta);
    expect(screen.getByPlaceholderText('メール')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeTruthy();
  });
});
