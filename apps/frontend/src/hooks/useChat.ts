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

async function readStreamAsText(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      text += chunk;
      onChunk(chunk);
    }
  } catch (error) {
    console.error('Stream read error:', error);
    throw error;
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
    setIsLoading(true);

    // ユーザーメッセージを追加
    setMessages((prev) => {
      const newMessages = [...prev, { role: 'user' as const, content }];
      // アシスタントメッセージを空で初期化
      return [...newMessages, { role: 'assistant' as const, content: '' }];
    });

    try {
      // HonoのRPCクライアントがストリーミングレスポンスを正しく処理しない可能性があるため、
      // 直接fetchを使用してストリーミングレスポンスを処理
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8787';
      const res = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: content }),
      });
      
      console.log('Chat response status:', res.status);
      console.log('Chat response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errBody = await res.text();
        console.error('Chat request failed:', res.status, errBody);
        throw new Error(errBody || `Chat request failed: ${res.status}`);
      }
      const body = res.body;
      if (!body) {
        console.warn('Chat response body is null');
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = { role: 'assistant', content: '応答がありませんでした。' };
          }
          return updated;
        });
        return;
      }
      
      console.log('Starting to read stream...');
      let accumulatedText = '';
      let chunkCount = 0;
      await readStreamAsText(body, (chunk) => {
        chunkCount++;
        accumulatedText += chunk;
        console.log(`Chunk ${chunkCount}:`, chunk.substring(0, 50));
        // ストリーミング中にメッセージを更新
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = { role: 'assistant', content: accumulatedText };
          }
          return updated;
        });
      });
      
      console.log('Stream completed. Total chunks:', chunkCount, 'Total length:', accumulatedText.length);
      if (accumulatedText.length === 0) {
        console.warn('Stream completed but no content received');
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant' && updated[lastIndex].content === '') {
            updated[lastIndex] = { role: 'assistant', content: '応答がありませんでした。' };
          }
          return updated;
        });
      }
      
      await queryClient.invalidateQueries({ queryKey: ['ai', 'usage'] });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Chat error:', e);
      setError(e instanceof Error ? e : new Error(errorMessage));
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        // 最後のメッセージが空のassistantメッセージなら置き換え
        if (lastIndex >= 0 && updated[lastIndex].role === 'assistant' && updated[lastIndex].content === '') {
          updated[lastIndex] = { role: 'assistant', content: '申し訳ありません。応答を取得できませんでした。' };
        } else {
          updated.push({ role: 'assistant', content: '申し訳ありません。応答を取得できませんでした。' });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  return { messages, isLoading, sendMessage, error };
}
