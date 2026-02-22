/**
 * AppLayout のテスト（Task 11.1）
 * ログアウトボタンクリックで signOut が呼ばれ、続けて /login へ遷移することを検証（Req 4.4）。
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import { PATH_LOGIN } from '@/lib/paths';
import type { CharacterProfile } from '@skill-quest/shared';

const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockNavigate = vi.fn();

const mockProfile: CharacterProfile = {
  name: 'Test',
  className: 'Warrior',
  title: '',
  prologue: '',
  themeColor: '#000',
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  gold: 0,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
    session: { user: { id: 'u1' } },
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: mockProfile,
    setProfile: vi.fn(),
  }),
}));

vi.mock('@/components/StatusPanel', () => ({ default: () => <div>StatusPanel</div> }));
vi.mock('@/components/GoalUpdateUI', () => ({ default: () => <div>GoalUpdateUI</div> }));
vi.mock('@/components/SuggestedQuestsModal', () => ({ default: () => null }));

function renderAppLayout() {
  return render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockNavigate.mockClear();
  });

  it('ログアウトボタンクリックで signOut が呼ばれ、/login へ遷移する（Task 11.1, Req 4.4）', async () => {
    renderAppLayout();
    const logoutButton = screen.getByRole('button', { name: 'ログアウト' });
    fireEvent.click(logoutButton);
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(PATH_LOGIN);
    });
  });
});
