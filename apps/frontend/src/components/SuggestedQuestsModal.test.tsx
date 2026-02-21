/**
 * SuggestedQuestsModal のテスト（Task 7.2）
 * - 提案タスク一覧表示・採用時は一括登録して閉じる・却下時は閉じるのみ・AI失敗時は再試行案内
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedQuestsModal from './SuggestedQuestsModal';
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

describe('SuggestedQuestsModal (Task 7.2)', () => {
  const onClose = vi.fn();
  const profile = createTestCharacterProfile({ goal: '英語' });

  beforeEach(() => {
    onClose.mockClear();
    mockFetchSuggestions.mockClear();
    mockAdoptQuests.mockClear();
    mockUseSuggestQuests.mockReturnValue({ ...defaultHookReturn });
  });

  it('提案タスク一覧を表示する', () => {
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: mockSuggestions,
    });
    render(
      <SuggestedQuestsModal open={true} onClose={onClose} goal="英語" profile={profile} />
    );
    expect(screen.getByText('単語を覚える')).toBeTruthy();
    expect(screen.getByText('リスニング練習')).toBeTruthy();
  });

  it('採用時に一括登録し、成功後に onClose を呼ぶ', () => {
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: mockSuggestions,
    });
    render(
      <SuggestedQuestsModal open={true} onClose={onClose} goal="英語" profile={profile} />
    );
    const adoptButton = screen.getByRole('button', { name: /採用/ });
    fireEvent.click(adoptButton);

    expect(mockAdoptQuests).toHaveBeenCalledWith(
      { quests: mockSuggestions },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    const call = mockAdoptQuests.mock.calls[0];
    const onSuccess = (call?.[1] as { onSuccess?: () => void })?.onSuccess;
    if (onSuccess) onSuccess();
    expect(onClose).toHaveBeenCalled();
  });

  it('却下時は一括登録せず onClose を呼ぶ', () => {
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestions: mockSuggestions,
    });
    render(
      <SuggestedQuestsModal open={true} onClose={onClose} goal="英語" profile={profile} />
    );
    const skipButton = screen.getByRole('button', { name: /スキップ/ });
    fireEvent.click(skipButton);

    expect(mockAdoptQuests).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('AI失敗・タイムアウト時に再試行または後で試す案内を表示する', () => {
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestError: new Error('AIの生成に失敗しました'),
    });
    render(
      <SuggestedQuestsModal open={true} onClose={onClose} goal="英語" profile={profile} />
    );
    expect(screen.getByText(/しばらく経ってから再試行してください/)).toBeTruthy();
  });

  it('エラー時に再試行ボタンで fetchSuggestions を呼ぶ', () => {
    mockUseSuggestQuests.mockReturnValue({
      ...defaultHookReturn,
      suggestError: new Error('タイムアウト'),
    });
    render(
      <SuggestedQuestsModal open={true} onClose={onClose} goal="英語" profile={profile} />
    );
    const retryButton = screen.getByRole('button', { name: /再試行/ });
    fireEvent.click(retryButton);
    expect(mockFetchSuggestions).toHaveBeenCalledWith({ goal: '英語' });
  });
});
