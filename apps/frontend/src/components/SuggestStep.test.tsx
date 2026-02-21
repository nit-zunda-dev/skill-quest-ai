/**
 * SuggestStep のテスト（Task 6.2）
 * - 保存済み目標で提案取得・一覧表示・採用/却下・goal 無し時は簡易入力フォーム・ローディング・エラー表示
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuggestStep from './SuggestStep';
import { createTestCharacterProfile } from '../../../../tests/fixtures';
import { TaskType, Difficulty } from '@skill-quest/shared';
import type { SuggestedQuestItem } from '@skill-quest/shared';

const mockFetchSuggestions = vi.fn();
const mockAdoptQuests = vi.fn();
const mockUseSuggestQuests = vi.fn();

vi.mock('@/hooks/useSuggestQuests', () => ({
  useSuggestQuests: () => mockUseSuggestQuests(),
}));

const defaultHookReturn = {
  fetchSuggestions: mockFetchSuggestions,
  adoptQuests: mockAdoptQuests,
  suggestions: [] as SuggestedQuestItem[],
  isFetchingSuggestions: false,
  isAdopting: false,
  suggestError: undefined as Error | undefined,
  adoptError: undefined as Error | undefined,
};

const mockSuggestions: SuggestedQuestItem[] = [
  { title: '単語を覚える', type: TaskType.DAILY, difficulty: Difficulty.EASY },
  { title: 'リスニング練習', type: TaskType.HABIT, difficulty: Difficulty.MEDIUM },
];

describe('SuggestStep (Task 6.2)', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    onComplete.mockClear();
    mockFetchSuggestions.mockClear();
    mockAdoptQuests.mockClear();
    mockUseSuggestQuests.mockReturnValue({ ...defaultHookReturn });
  });

  it('goal がある場合に提案取得を呼び一覧表示する', async () => {
    const profile = createTestCharacterProfile({ goal: '英語力を上げる' });
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: [],
    });

    const { rerender } = render(<SuggestStep profile={profile} onComplete={onComplete} />);

    await waitFor(() => {
      expect(mockFetchSuggestions).toHaveBeenCalledWith({ goal: '英語力を上げる' });
    });

    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: mockSuggestions,
    });
    rerender(<SuggestStep profile={profile} onComplete={onComplete} />);

    expect(screen.getByText('単語を覚える')).toBeTruthy();
    expect(screen.getByText('リスニング練習')).toBeTruthy();
  });

  it('goal が無い場合に簡易入力フォームを表示する', () => {
    const profile = createTestCharacterProfile();
    const p = { ...profile, goal: undefined };
    render(<SuggestStep profile={p} onComplete={onComplete} />);

    expect(screen.getByPlaceholderText(/目標|例：/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /提案を取得|生成/ })).toBeTruthy();
  });

  it('生成中はローディングを表示する', () => {
    const profile = createTestCharacterProfile({ goal: '英語' });
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      isFetchingSuggestions: true,
    });

    render(<SuggestStep profile={profile} onComplete={onComplete} />);

    expect(screen.getByText(/読み込み中|生成中|ローディング/)).toBeTruthy();
  });

  it('採用時は一括登録して onComplete を呼ぶ', () => {
    const profile = createTestCharacterProfile({ goal: '英語' });
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: mockSuggestions,
    });

    render(<SuggestStep profile={profile} onComplete={onComplete} />);

    const adoptButton = screen.getByRole('button', { name: /採用/ });
    fireEvent.click(adoptButton);

    expect(mockAdoptQuests).toHaveBeenCalledWith(
      { quests: mockSuggestions },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    const call = mockAdoptQuests.mock.calls[0];
    if (call?.[1]?.onSuccess) (call[1] as { onSuccess: () => void }).onSuccess();
    expect(onComplete).toHaveBeenCalled();
  });

  it('却下時は一括登録せず onComplete を呼ぶ', () => {
    const profile = createTestCharacterProfile({ goal: '英語' });
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: mockSuggestions,
    });

    render(<SuggestStep profile={profile} onComplete={onComplete} />);

    const rejectButton = screen.getByRole('button', { name: /却下|スキップ/ });
    fireEvent.click(rejectButton);

    expect(mockAdoptQuests).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('提案取得エラー時に再試行案内を表示する', () => {
    const profile = createTestCharacterProfile({ goal: '英語' });
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestError: new Error('AIの生成に失敗しました'),
    });

    render(<SuggestStep profile={profile} onComplete={onComplete} />);

    expect(screen.getByText(/再試行してください/)).toBeTruthy();
  });
});
