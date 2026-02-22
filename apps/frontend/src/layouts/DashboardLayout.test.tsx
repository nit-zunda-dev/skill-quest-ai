/**
 * DashboardLayout の単体テスト（Task 10.2, Requirements 4.3）
 * Genesis 完了直後に location.state で profile が渡されたときダッシュボードを表示する。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { DashboardLayout } from './DashboardLayout';
import { PATH_APP } from '@/lib/paths';

const queryClient = createQueryClient();

const mockProfile = {
  name: 'Test',
  className: '冒険者',
  title: '旅人',
  prologue: 'Prologue',
  themeColor: '#000',
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  gold: 0,
  goal: 'Goal',
};

const mockUseAuth = vi.fn();
const mockUseGenesisOrProfile = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useGenesisOrProfile', () => ({
  useGenesisOrProfile: (opts: { isAuthenticated: boolean; isLoading: boolean }) =>
    mockUseGenesisOrProfile(opts),
}));

function renderWithRouter(ui: React.ReactElement, state?: object) {
  const initialEntries = state
    ? [{ pathname: PATH_APP, state }]
    : [PATH_APP];
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardLayout (Task 10.2)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseGenesisOrProfile.mockReset();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
  });

  it('location.state に fromGenesis と profile があるとき、ダッシュボード（AppLayout）を表示する', () => {
    renderWithRouter(<DashboardLayout />, { fromGenesis: true, profile: mockProfile });
    expect(screen.queryByText('読み込み中...')).toBeNull();
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('location.state が無いときは useGenesisOrProfile の結果でダッシュボードを表示する', () => {
    mockUseGenesisOrProfile.mockReturnValue({
      kind: 'dashboard',
      profile: mockProfile,
    });
    renderWithRouter(<DashboardLayout />);
    expect(screen.getByRole('navigation')).toBeTruthy();
  });
});
