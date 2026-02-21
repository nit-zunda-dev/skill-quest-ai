/**
 * GoalUpdateUI のテスト（Task 7.1）
 * - 現在の目標表示・編集・確定、429 時は案内メッセージ、成功時は onGoalUpdateSuccess で提案モーダルを開く
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoalUpdateUI from './GoalUpdateUI';
import { createTestCharacterProfile } from '../../../../tests/fixtures';
import { Genre } from '@skill-quest/shared';

const mockUpdateGoal = vi.fn();
vi.mock('@/lib/api-client', () => ({
  updateGoal: (req: { goal: string }) => mockUpdateGoal(req),
}));

describe('GoalUpdateUI (Task 7.1)', () => {
  const onGoalUpdateSuccess = vi.fn();

  beforeEach(() => {
    mockUpdateGoal.mockReset();
    onGoalUpdateSuccess.mockReset();
  });

  it('現在の目標を表示する', () => {
    const profile = createTestCharacterProfile({ goal: '英語力を上げる', genre: Genre.FANTASY });
    render(<GoalUpdateUI profile={profile} onGoalUpdateSuccess={onGoalUpdateSuccess} />);
    expect(screen.getByDisplayValue('英語力を上げる')).toBeTruthy();
  });

  it('目標が無い場合はプレースホルダーで表示する', () => {
    const profile = createTestCharacterProfile({ genre: Genre.FANTASY });
    const p = { ...profile, goal: undefined };
    render(<GoalUpdateUI profile={p} onGoalUpdateSuccess={onGoalUpdateSuccess} />);
    const input = screen.getByPlaceholderText(/目標|例/);
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('確定時に目標更新 API を呼ぶ', async () => {
    const profile = createTestCharacterProfile({ goal: 'もとの目標', genre: Genre.FANTASY });
    mockUpdateGoal.mockResolvedValue(undefined);
    render(<GoalUpdateUI profile={profile} onGoalUpdateSuccess={onGoalUpdateSuccess} />);

    const input = screen.getByDisplayValue('もとの目標');
    fireEvent.change(input, { target: { value: '新しい目標' } });
    fireEvent.click(screen.getByRole('button', { name: /確定|更新/ }));

    await waitFor(() => {
      expect(mockUpdateGoal).toHaveBeenCalledWith({ goal: '新しい目標' });
    });
  });

  it('429 時は案内メッセージを表示する', async () => {
    const profile = createTestCharacterProfile({ goal: '目標', genre: Genre.FANTASY });
    mockUpdateGoal.mockRejectedValue(new Error('本日は目標の変更回数（2回）に達しています。'));
    render(<GoalUpdateUI profile={profile} onGoalUpdateSuccess={onGoalUpdateSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /確定|更新/ }));

    await waitFor(() => {
      expect(screen.getByText(/本日は目標の変更回数（2回）に達しています/)).toBeTruthy();
    });
    expect(onGoalUpdateSuccess).not.toHaveBeenCalled();
  });

  it('成功時は onGoalUpdateSuccess を呼ぶ（提案モーダルを開く）', async () => {
    const profile = createTestCharacterProfile({ goal: '目標', genre: Genre.FANTASY });
    mockUpdateGoal.mockResolvedValue(undefined);
    render(<GoalUpdateUI profile={profile} onGoalUpdateSuccess={onGoalUpdateSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /確定|更新/ }));

    await waitFor(() => {
      expect(onGoalUpdateSuccess).toHaveBeenCalledWith('目標');
    });
  });
});
