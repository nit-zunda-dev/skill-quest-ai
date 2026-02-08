/**
 * ストリーミングチャット用カスタムフック（タスク 9.1）
 * - Server-Sent Events / ReadableStream でストリーミングレスポンスを処理
 * - メッセージ状態とローディング状態を管理
 * - Workers AI のストリーム形式（テキストチャンク）に合わせたアダプタ
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

async function readStreamAsText(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  return text;
}

export function useChat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const sendMessage = useCallback(async (content: string) => {
    setError(undefined);
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setIsLoading(true);

    try {
      const res = await client.api.ai.chat.$post({ json: { message: content } });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `Chat request failed: ${res.status}`);
      }
      const body = res.body;
      if (!body) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        return;
      }
      const fullText = await readStreamAsText(body);
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      await queryClient.invalidateQueries({ queryKey: ['ai', 'usage'] });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setMessages((prev) => [...prev, { role: 'assistant', content: '申し訳ありません。応答を取得できませんでした。' }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, sendMessage, error };
}
