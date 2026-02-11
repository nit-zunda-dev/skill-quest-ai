/**
 * useAiUsage のテスト（タスク 9.3）
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAiUsage } from './useAiUsage';
vi.mock('@/lib/client', () => ({
  client: {
    api: {
      ai: {
        usage: {
          $get: vi.fn(),
        },
      },
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useAiUsage', () => {
  beforeEach(async () => {
    const { client } = await import('@/lib/client') as { client: { api: { ai: { usage: { $get: ReturnType<typeof vi.fn> } } } } };
    vi.mocked(client.api.ai.usage.$get).mockResolvedValue({
      ok: true,
      json: async () => ({
        characterGenerated: false,
        narrativeRemaining: 1,
        partnerRemaining: 1,
        chatRemaining: 10,
        limits: { narrative: 1, partner: 1, chat: 10 },
      }),
    } as Response);
  });

  it('returns usage with chatRemaining and limits', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAiUsage(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.chatRemaining).toBe(10);
    expect(result.current.data?.limits.chat).toBe(10);
  });

  it('returns zero chatRemaining when API says 0', async () => {
    const { client } = await import('@/lib/client') as { client: { api: { ai: { usage: { $get: ReturnType<typeof vi.fn> } } } } };
    vi.mocked(client.api.ai.usage.$get).mockResolvedValue({
      ok: true,
      json: async () => ({
        characterGenerated: true,
        narrativeRemaining: 0,
        partnerRemaining: 0,
        chatRemaining: 0,
        limits: { narrative: 1, partner: 1, chat: 10 },
      }),
    } as Response);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAiUsage(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.chatRemaining).toBe(0);
  });
});
