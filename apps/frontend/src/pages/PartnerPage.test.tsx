/**
 * PartnerPage のテスト（Task 5.1, 7.4）
 * バリアント取得と文脈→表情マッピングを使い、パートナー画像がチャット領域の上または横に配置されることを検証する。
 * Task 7.4: パートナー画像表示とバリアント共有・反映の結合テスト。
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import {
  PartnerVariantProvider,
  PARTNER_VARIANT_STORAGE_KEY,
} from '@/contexts/PartnerVariantContext';
import PartnerPage from './PartnerPage';
import PartnerWidget from '@/components/PartnerWidget';

const mockSendMessage = vi.fn();
const queryClient = createQueryClient();

vi.mock('@/hooks/useChat', () => ({
  useChat: vi.fn(),
}));

vi.mock('@/hooks/useAiUsage', () => ({
  useAiUsage: vi.fn(),
}));

function renderPartnerPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <PartnerVariantProvider>
        <PartnerPage />
      </PartnerVariantProvider>
    </QueryClientProvider>
  );
}

describe('PartnerPage with PartnerAvatar (Task 5.1)', () => {
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
  });

  it('renders PartnerAvatar with variant and idle expression (default)', () => {
    renderPartnerPage();
    const img = screen.getByRole('img', { name: /AIパートナー/i });
    expect((img as HTMLImageElement).src).toContain('/images/partner/');
    expect((img as HTMLImageElement).src).toContain('expression-default.png');
  });

  it('renders PartnerAvatar with cheer expression when loading', async () => {
    const { useChat } = await import('@/hooks/useChat');
    (useChat as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [],
      isLoading: true,
      sendMessage: mockSendMessage,
      error: undefined,
    });
    renderPartnerPage();
    const img = screen.getByRole('img', { name: /AIパートナー/i });
    expect((img as HTMLImageElement).src).toContain('expression-cheer.png');
  });

  it('renders PartnerAvatar with male variant when context has male (Task 7.4)', () => {
    localStorage.setItem(PARTNER_VARIANT_STORAGE_KEY, 'male');
    renderPartnerPage();
    const img = screen.getByRole('img', { name: /AIパートナー/i });
    expect((img as HTMLImageElement).src).toContain('/images/partner/male/');
    localStorage.removeItem(PARTNER_VARIANT_STORAGE_KEY);
  });
});

describe('PartnerPage and PartnerWidget shared variant (Task 7.4, Req 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
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
  });

  it('page and widget both show partner image and same variant when under same Provider', () => {
    localStorage.setItem(PARTNER_VARIANT_STORAGE_KEY, 'male');
    render(
      <QueryClientProvider client={queryClient}>
        <PartnerVariantProvider>
          <PartnerPage />
          <PartnerWidget />
        </PartnerVariantProvider>
      </QueryClientProvider>
    );
    const pageImg = screen.getByRole('img', { name: /AIパートナー/i });
    expect((pageImg as HTMLImageElement).src).toContain('/images/partner/male/');
    fireEvent.click(screen.getByRole('button', { name: /チャットを開く/ }));
    const imgs = screen.getAllByRole('img', { name: /AIパートナー/i });
    expect(imgs.length).toBe(2);
    imgs.forEach((img) => {
      expect((img as HTMLImageElement).src).toContain('/images/partner/male/');
    });
  });
});
