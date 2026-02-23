/**
 * パートナーチャットウィジェット（タスク 9.2, 6.1）
 * - useChat でストリーミング対応
 * - メッセージ逐次表示・ローディング表示・送信フォーム
 * - Task 6.1: バリアントと文脈→表情マッピングでパートナー画像をウィジェット内に表示
 */
import React, { useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAiUsage } from '@/hooks/useAiUsage';
import { usePartnerVariant } from '@/contexts/PartnerVariantContext';
import { PartnerAvatar } from '@/components/PartnerAvatar';
import { getExpressionForPartner } from '@/lib/partner-expression-context';

const PartnerWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { variant } = usePartnerVariant();
  const { messages, isLoading, sendMessage, error } = useChat();
  const { data: usage } = useAiUsage();
  const chatRemaining = usage?.chatRemaining ?? null;
  const isChatLimitReached = chatRemaining !== null && chatRemaining <= 0;

  const expression = useMemo(
    () => getExpressionForPartner({ isLoading, messages }),
    [isLoading, messages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading || isChatLimitReached) return;
    sendMessage(text);
    setInputValue('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="relative mb-4 w-80 max-h-[70vh] flex flex-col bg-slate-800/90 backdrop-blur-md border border-cyan-500/30 text-slate-200 p-4 rounded-2xl rounded-tr-none shadow-2xl shadow-cyan-500/10 animate-fade-in-up">
          <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-cyan-500/20 mb-3">
            <PartnerAvatar
              variant={variant}
              expression={expression}
              className="w-14 h-14 object-contain shrink-0"
              alt="AIパートナー"
            />
            <p className="text-sm font-medium text-white">AIパートナー</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3">
            {messages.length === 0 && !isLoading && (
              <p className="text-sm text-slate-500">相棒があなたの話を待っています。何でも聞いてみましょう。</p>
            )}
            {messages
              .filter((msg) => msg.content.trim() !== '')
              .map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed break-words ${
                    msg.role === 'user' ? 'text-right ml-8' : 'text-left mr-8'
                  }`}
                >
                  <span
                    className={
                      msg.role === 'user'
                        ? 'inline-block bg-cyan-500/80 text-white px-3 py-1.5 rounded-lg rounded-tr-none border border-cyan-400/30'
                        : 'inline-block bg-slate-700/90 text-slate-200 px-3 py-1.5 rounded-lg rounded-tl-none border border-cyan-500/20'
                    }
                  >
                    {msg.content}
                  </span>
                </div>
              ))}
            {isLoading && (
              <div className="flex space-x-1 justify-start py-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-400 mb-2" role="alert">
              {error.message}
            </p>
          )}
          {chatRemaining !== null && (
            <p className="text-xs text-slate-400 mb-2">
              {isChatLimitReached
                ? '本日のチャット回数を使い切りました。明日またお試しください。'
                : `チャット 残り${chatRemaining}回`}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="メッセージを入力"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              disabled={isLoading || isChatLimitReached}
              aria-label="メッセージ入力"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim() || isChatLimitReached}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:pointer-events-none rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98] shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              aria-label="送信"
            >
              送信
            </button>
          </form>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-slate-800 transform rotate-45 border-r border-b border-cyan-500/30 pointer-events-none" />
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        aria-label={isOpen ? 'チャットを閉じる' : 'チャットを開く'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default PartnerWidget;
