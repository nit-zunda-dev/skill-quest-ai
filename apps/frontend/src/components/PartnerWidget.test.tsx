/**
 * PartnerWidget のテスト（タスク 9.2, 6.1, 7.4）
 * - ストリーミングメッセージを表示するUIを検証
 * - ローディングインジケーターを検証
 * - メッセージ送信フォームを検証
 * - Task 6.1: ウィジェット内にパートナー画像を表示
 * - Task 7.4: バリアントが共有・反映される結合テスト
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PartnerVariantProvider,
  PARTNER_VARIANT_STORAGE_KEY,
} from '@/contexts/PartnerVariantContext';
import PartnerWidget from './PartnerWidget';

const mockSendMessage = vi.fn();

vi.mock('@/hooks/useChat', () => ({
  useChat: vi.fn(),
}));

vi.mock('@/hooks/useAiUsage', () => ({
  useAiUsage: vi.fn(),
}));

vi.mock('@/hooks/usePartnerBar', () => ({
  usePartnerFavorability: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderPartnerWidget() {
  return render(
    <QueryClientProvider client={queryClient}>
      <PartnerVariantProvider>
        <PartnerWidget />
      </PartnerVariantProvider>
    </QueryClientProvider>
  );
}

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
    const { useAiUsage } = await import('@/hooks/useAiUsage');
    (useAiUsage as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { chatRemaining: 10, limits: { chat: 10 } },
    });
    const { usePartnerFavorability } = await import('@/hooks/usePartnerBar');
    (usePartnerFavorability as ReturnType<typeof vi.fn>).mockReturnValue({
      data: 500,
    });
  });

  it('開閉ボタンをクリックするとパネルが開く', () => {
    renderPartnerWidget();
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
    renderPartnerWidget();
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
    renderPartnerWidget();
    fireEvent.click(screen.getAllByRole('button')[0]);
    const loadingDots = document.querySelectorAll('.animate-bounce');
    expect(loadingDots.length).toBeGreaterThanOrEqual(1);
  });

  it('メッセージ送信フォームで入力して送信すると sendMessage が呼ばれる', () => {
    renderPartnerWidget();
    fireEvent.click(screen.getAllByRole('button')[0]);
    const input = screen.getByPlaceholderText(/メッセージ|入力/);
    fireEvent.change(input, { target: { value: 'テストメッセージ' } });
    const sendButton = screen.getByRole('button', { name: /送信/ });
    fireEvent.click(sendButton);
    expect(mockSendMessage).toHaveBeenCalledWith('テストメッセージ');
  });

  it('残り回数を表示し、制限到達時はメッセージ表示と送信ボタン無効', async () => {
    const { useAiUsage } = await import('@/hooks/useAiUsage');
    (useAiUsage as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { chatRemaining: 0, limits: { chat: 10 } },
    });
    renderPartnerWidget();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText(/本日のチャット回数を使い切りました/)).toBeTruthy();
    const sendButton = screen.getByRole('button', { name: /送信/ });
    expect((sendButton as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('PartnerWidget with PartnerAvatar (Task 6.1)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { useChat } = await import('@/hooks/useChat');
    (useChat as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      error: undefined,
    });
    const { useAiUsage } = await import('@/hooks/useAiUsage');
    (useAiUsage as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { chatRemaining: 10, limits: { chat: 10 } },
    });
    const { usePartnerFavorability } = await import('@/hooks/usePartnerBar');
    (usePartnerFavorability as ReturnType<typeof vi.fn>).mockReturnValue({
      data: 0,
    });
  });

  it('ウィジェットを開くとパートナー画像が表示され、バリアント・文脈に応じた表情になる（idle）', () => {
    renderPartnerWidget();
    fireEvent.click(screen.getAllByRole('button')[0]);
    const img = screen.getByRole('img', { name: /AIパートナー/i });
    expect((img as HTMLImageElement).src).toContain('/images/partner/');
    expect((img as HTMLImageElement).src).toContain('expression-default.png');
  });

  it('送信中はパートナー画像が cheer 表情で表示される', async () => {
    const { useChat } = await import('@/hooks/useChat');
    (useChat as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [],
      isLoading: true,
      sendMessage: mockSendMessage,
      error: undefined,
    });
    renderPartnerWidget();
    fireEvent.click(screen.getAllByRole('button')[0]);
    const img = screen.getByRole('img', { name: /AIパートナー/i });
    expect((img as HTMLImageElement).src).toContain('expression-cheer.png');
  });

  it('ウィジェットを開くと male バリアントでパートナー画像が表示される（Task 7.4）', () => {
    localStorage.setItem(PARTNER_VARIANT_STORAGE_KEY, 'male');
    renderPartnerWidget();
    fireEvent.click(screen.getByRole('button', { name: /チャットを開く/ }));
    const img = screen.getByRole('img', { name: /AIパートナー/i });
    expect((img as HTMLImageElement).src).toContain('/images/partner/male/');
    localStorage.removeItem(PARTNER_VARIANT_STORAGE_KEY);
  });
});
