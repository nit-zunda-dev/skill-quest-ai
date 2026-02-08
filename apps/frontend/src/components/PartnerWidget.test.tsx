/**
 * PartnerWidget のテスト（タスク 9.2）
 * - ストリーミングメッセージを表示するUIを検証
 * - ローディングインジケーターを検証
 * - メッセージ送信フォームを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PartnerWidget from './PartnerWidget';

const mockSendMessage = vi.fn();

vi.mock('@/hooks/useChat', () => ({
  useChat: vi.fn(),
}));

describe('PartnerWidget', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { useChat } = await import('@/hooks/useChat');
    (useChat as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      error: undefined,
    });
  });

  it('開閉ボタンをクリックするとパネルが開く', () => {
    render(<PartnerWidget />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(screen.getByPlaceholderText(/メッセージ|入力/)).toBeTruthy();
  });

  it('メッセージ一覧を表示する', async () => {
    const { useChat } = await import('@/hooks/useChat');
    (useChat as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [
        { role: 'user', content: 'こんにちは' },
        { role: 'assistant', content: 'こんにちは！何かお手伝いしましょうか。' },
      ],
      isLoading: false,
      sendMessage: mockSendMessage,
      error: undefined,
    });
    render(<PartnerWidget />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('こんにちは')).toBeTruthy();
    expect(screen.getByText('こんにちは！何かお手伝いしましょうか。')).toBeTruthy();
  });

  it('ローディング中はローディングインジケーターを表示する', async () => {
    const { useChat } = await import('@/hooks/useChat');
    (useChat as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [{ role: 'user', content: 'テスト' }],
      isLoading: true,
      sendMessage: mockSendMessage,
      error: undefined,
    });
    render(<PartnerWidget />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const loadingDots = document.querySelectorAll('.animate-bounce');
    expect(loadingDots.length).toBeGreaterThanOrEqual(1);
  });

  it('メッセージ送信フォームで入力して送信すると sendMessage が呼ばれる', () => {
    render(<PartnerWidget />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const input = screen.getByPlaceholderText(/メッセージ|入力/);
    fireEvent.change(input, { target: { value: 'テストメッセージ' } });
    const sendButton = screen.getByRole('button', { name: /送信/ });
    fireEvent.click(sendButton);
    expect(mockSendMessage).toHaveBeenCalledWith('テストメッセージ');
  });
});
