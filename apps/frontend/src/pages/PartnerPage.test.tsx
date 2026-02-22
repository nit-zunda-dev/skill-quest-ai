/**
 * PartnerPage のテスト（Task 5.1）
 * バリアント取得と文脈→表情マッピングを使い、パートナー画像がチャット領域の上または横に配置されることを検証する。
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { PartnerVariantProvider } from '@/contexts/PartnerVariantContext';
import PartnerPage from './PartnerPage';

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
});
