/**
 * App 未認証分岐のテスト（Task 3.1, 5.2）
 * - フォーム表示フラグが偽のときランディングが表示される（Task 5.2, Req 1.3, 5.3）
 * - フォーム表示フラグが真のときログイン/サインアップフォームが表示される（Task 5.2）
 * - Genesis フロー: RESULT の次に提案ステップを表示し、完了でダッシュボードへ（Task 6.1）
 * - Task 8.2: ルート駆動で / はランディング、/login はフォーム（Req 2.3）
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { createQueryClient } from '@/lib/query';
import { QueryClientProvider } from '@tanstack/react-query';
import { generateCharacter } from '@/lib/api-client';
import { createTestCharacterProfile } from '../../../tests/fixtures';
import { PATH_LANDING, PATH_LOGIN } from '@/lib/paths';

const mockRefetch = vi.fn();
const mockUseAuth = vi.fn();
const mockUseGenesisOrProfile = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useGenesisOrProfile', () => ({
  useGenesisOrProfile: (opts: { isAuthenticated: boolean; isLoading: boolean }) => mockUseGenesisOrProfile(opts),
}));

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, generateCharacter: vi.fn() };
});

const queryClient = createQueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function resetHistoryToLanding() {
  window.history.replaceState(null, '', window.location.pathname || '/');
}

describe('App unauthenticated branch (Task 3.1, 5.2)', () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    resetHistoryToLanding();
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: mockRefetch,
    });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' as const });
  });

  it('shows landing at / and login/signup form after navigating to /login (Task 5.2, 8.2)', () => {
    render(
      <MemoryRouter initialEntries={[PATH_LANDING]}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('landing-page')).toBeTruthy();
    expect(screen.queryByPlaceholderText('メール')).toBeNull();

    const cta = screen.getByRole('button', { name: /始める/ });
    fireEvent.click(cta);
    expect(screen.getByPlaceholderText('メール')).toBeTruthy();
    expect(screen.queryByTestId('landing-page')).toBeNull();
  });
});

describe('Landing CTA switches to form (Task 3.2, Req 5.1, 5.3)', () => {
  beforeEach(() => {
    resetHistoryToLanding();
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: mockRefetch,
    });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' as const });
  });

  it('clicking landing primary CTA navigates to /login and shows login/signup form', () => {
    render(
      <MemoryRouter initialEntries={[PATH_LANDING]}>
        <QueryClientProvider client={createQueryClient()}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('landing-page')).toBeTruthy();
    const cta = screen.getByRole('button', { name: /始める/ });
    fireEvent.click(cta);
    expect(screen.getByPlaceholderText('メール')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeTruthy();
  });
});

describe('Genesis flow: RESULT → SUGGEST → アプリ (Task 6.1)', () => {
  const mockProfile = createTestCharacterProfile({
    className: 'テストクラス',
    title: 'テストタイトル',
    prologue: 'テストプロローグ',
  });

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: { user: { name: 'Test User' } },
      isLoading: false,
      isAuthenticated: true,
      refetch: vi.fn(),
    });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'genesis' as const });
  });

  it('RESULT 完了後に提案ステップを表示し、その完了後にアプリ（ホーム）へ遷移する', async () => {
    vi.mocked(generateCharacter).mockResolvedValue(mockProfile);

    render(
      <MemoryRouter initialEntries={['/genesis']}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /冒険を始める/ }));
    const goalInput = screen.getByPlaceholderText(/英語学習/);
    fireEvent.change(goalInput, { target: { value: '英語' } });
    fireEvent.click(screen.getByRole('button', { name: /決定して次へ/ }));

    await waitFor(() => {
      expect(screen.getByText('世界へ旅立つ')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '世界へ旅立つ' }));

    expect(screen.getByTestId('genesis-suggest-step')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /ダッシュボードへ/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ログアウト/ })).toBeTruthy();
    });
  });
});

describe('App route-driven landing and login (Task 8.2, Req 2.3)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      refetch: mockRefetch,
    });
    mockUseGenesisOrProfile.mockReturnValue({ kind: 'loading' as const });
  });

  it('shows landing at path /', () => {
    render(
      <MemoryRouter initialEntries={[PATH_LANDING]}>
        <QueryClientProvider client={createQueryClient()}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('landing-page')).toBeTruthy();
    expect(screen.queryByPlaceholderText('メール')).toBeNull();
  });

  it('shows login form at path /login', () => {
    render(
      <MemoryRouter initialEntries={[PATH_LOGIN]}>
        <QueryClientProvider client={createQueryClient()}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('メール')).toBeTruthy();
    expect(screen.queryByTestId('landing-page')).toBeNull();
  });

  it('navigates to /login when clicking 始める at /', async () => {
    render(
      <MemoryRouter initialEntries={[PATH_LANDING]}>
        <QueryClientProvider client={createQueryClient()}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('landing-page')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /始める/ }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('メール')).toBeTruthy();
    });
  });
});
