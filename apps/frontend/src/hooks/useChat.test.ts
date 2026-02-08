/**
 * useChat フックのテスト（タスク 9.1）
 * - ストリーミングレスポンスを処理することを検証
 * - メッセージ状態とローディング状態を管理することを検証
 * - Workers AI のストリーム形式に合わせたアダプタを検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChat } from './useChat';

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

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      ai: {
        chat: {
          $post: vi.fn(),
        },
      },
    },
  },
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態で messages が空・isLoading が false である', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('sendMessage を呼ぶとユーザーメッセージが追加されローディングになる', async () => {
    const { client } = await import('@/lib/client');
    const mockPost = client.api.ai.chat.$post as ReturnType<typeof vi.fn>;
    // 解決しない Promise でローディング中の状態を維持
    mockPost.mockImplementation(() => new Promise<Response>(() => {}));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('テスト');
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0]).toEqual({ role: 'user', content: 'テスト' });
      expect(result.current.isLoading).toBe(true);
    });
  });

  it('ストリーム完了後にアシスタントメッセージが追加されローディングが解除される', async () => {
    const { client } = await import('@/lib/client');
    const mockPost = client.api.ai.chat.$post as ReturnType<typeof vi.fn>;
    mockPost.mockResolvedValue(createStreamResponse(['Hello', ' ', 'world']));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('hi');
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0]).toEqual({ role: 'user', content: 'hi' });
      expect(result.current.messages[1]).toEqual({ role: 'assistant', content: 'Hello world' });
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('API がエラーを返すと error が設定されローディングが解除される', async () => {
    const { client } = await import('@/lib/client');
    const mockPost = client.api.ai.chat.$post as ReturnType<typeof vi.fn>;
    mockPost.mockResolvedValue(new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 }));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('hi');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  it('sendMessage は client.api.ai.chat.$post に message を渡して呼ぶ', async () => {
    const { client } = await import('@/lib/client');
    const mockPost = client.api.ai.chat.$post as ReturnType<typeof vi.fn>;
    mockPost.mockResolvedValue(createStreamResponse(['OK']));

    const { result } = renderHook(() => useChat());
    await act(async () => {
      result.current.sendMessage('送信テキスト');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockPost).toHaveBeenCalledWith({ json: { message: '送信テキスト' } });
  });
});
