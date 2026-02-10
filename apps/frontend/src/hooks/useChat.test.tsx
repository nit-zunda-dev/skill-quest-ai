/**
 * useChat フックのテスト（タスク 9.1）
 * - ストリーミングレスポンスを処理することを検証
 * - メッセージ状態とローディング状態を管理することを検証
 * - Workers AI のストリーム形式に合わせたアダプタを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from './useChat';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function createStreamResponse(textChunks: string[]): Response {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of textChunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// useChatは直接fetchを使用するため、fetchをモックする
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('初期状態で messages が空・isLoading が false である', () => {
    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('sendMessage を呼ぶとユーザーメッセージが追加されローディングになる', async () => {
    // 解決しない Promise でローディング中の状態を維持
    mockFetch.mockImplementation(() => new Promise<Response>(() => {}));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('テスト');
    });

    await waitFor(() => {
      // 実装ではユーザーメッセージと空のアシスタントメッセージが追加される
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0]).toEqual({ role: 'user', content: 'テスト' });
      expect(result.current.messages[1]).toEqual({ role: 'assistant', content: '' });
      expect(result.current.isLoading).toBe(true);
    });
  });

  it('ストリーム完了後にアシスタントメッセージが追加されローディングが解除される', async () => {
    mockFetch.mockResolvedValue(createStreamResponse(['Hello', ' ', 'world']));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('hi');
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0]).toEqual({ role: 'user', content: 'hi' });
      expect(result.current.messages[1]).toEqual({ role: 'assistant', content: 'Hello world' });
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });
  });

  it('API がエラーを返すと error が設定されローディングが解除される', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 }));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('hi');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  it('sendMessage は fetch で /api/ai/chat に message を渡して呼ぶ', async () => {
    mockFetch.mockResolvedValue(createStreamResponse(['OK']));

    const { result } = renderHook(() => useChat(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.sendMessage('送信テキスト');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/chat'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ message: '送信テキスト' }),
      })
    );
  });
});
