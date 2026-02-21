/**
 * AIパートナーページ。チャットをフルページで表示（浮動ウィジェットの内容を流用）。
 */
import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAiUsage } from '@/hooks/useAiUsage';

export default function PartnerPage() {
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, error } = useChat();
  const { data: usage } = useAiUsage();
  const chatRemaining = usage?.chatRemaining ?? null;
  const isChatLimitReached = chatRemaining !== null && chatRemaining <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading || isChatLimitReached) return;
    sendMessage(text);
    setInputValue('');
  };

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">AIパートナー</h2>
        <p className="text-sm text-slate-500 mt-1">メッセージを送信して会話を始めましょう。</p>
        {chatRemaining !== null && (
          <p className="text-xs text-slate-400 mt-2">
            {isChatLimitReached
              ? '本日のチャット回数を使い切りました。明日またお試しください。'
              : `チャット 残り${chatRemaining}回`}
          </p>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-slate-500">メッセージを送信して会話を始めましょう。</p>
        )}
        {messages
          .filter((msg) => msg.content.trim() !== '')
          .map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <span
                className={
                  msg.role === 'user'
                    ? 'inline-block bg-indigo-600/80 text-white px-4 py-2 rounded-lg rounded-tr-none max-w-[85%]'
                    : 'inline-block bg-slate-700 text-slate-200 px-4 py-2 rounded-lg rounded-tl-none max-w-[85%]'
                }
              >
                <span className="text-sm leading-relaxed break-words">{msg.content}</span>
              </span>
            </div>
          ))}
        {isLoading && (
          <div className="flex space-x-1 py-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
          </div>
        )}
      </div>
      {error && (
        <p className="px-4 py-2 text-xs text-red-400" role="alert">
          {error.message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="メッセージを入力"
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
          disabled={isLoading || isChatLimitReached}
          aria-label="メッセージ入力"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim() || isChatLimitReached}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg font-medium text-white transition-colors"
          aria-label="送信"
        >
          送信
        </button>
      </form>
    </div>
  );
}
