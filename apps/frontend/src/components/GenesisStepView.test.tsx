/**
 * GenesisStepView の単体テスト（Task 10.1, Requirements 2.1）
 * ステップ遷移で URL が更新されること、不正な step で intro へリダイレクトすることを検証する。
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { GenesisStepView } from './GenesisStepView';
import { GenesisFlowProvider } from '@/contexts/GenesisFlowContext';
import { getGenesisStepPath, PATH_GENESIS_INTRO } from '@/lib/paths';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="navigate-redirect" data-to={to} />
    ),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { name: 'Test User' } } }),
}));

vi.mock('@/lib/api-client', () => ({
  generateCharacter: vi.fn(),
  normalizeProfileNumbers: (p: unknown) => p,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <GenesisFlowProvider>
        <Routes>
          <Route path="/genesis/:step" element={<GenesisStepView />} />
          <Route path="/genesis" element={<GenesisStepView />} />
        </Routes>
      </GenesisFlowProvider>
    </MemoryRouter>
  );
}

describe('GenesisStepView (Task 10.1)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('INTRO で「冒険を始める」をクリックすると /genesis/questions へナビゲートする', () => {
    renderAt('/genesis/intro');
    const button = screen.getByRole('button', { name: /冒険を始める/ });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(getGenesisStepPath('questions'));
  });

  it('不正な step のとき /genesis/intro へリダイレクトする', () => {
    renderAt('/genesis/invalid');
    const redirect = screen.getByTestId('navigate-redirect');
    expect(redirect.getAttribute('data-to')).toBe(PATH_GENESIS_INTRO);
  });

  it('intro ステップで Skill Quest AI を表示する', () => {
    renderAt('/genesis/intro');
    expect(screen.getByText('Skill Quest AI')).toBeTruthy();
  });

  it('questions ステップでプロフィール作成を表示する', () => {
    renderAt('/genesis/questions');
    expect(screen.getByText('プロフィールの作成')).toBeTruthy();
  });
});
