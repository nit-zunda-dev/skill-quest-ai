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
import { usePartnerFavorability } from '@/hooks/usePartnerBar';
import { useProfile } from '@/contexts/ProfileContext';

const PartnerWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { profile } = useProfile();
  const { variant } = usePartnerVariant();
  const { data: favorability } = usePartnerFavorability({ enabled: isOpen });
  const { messages, isLoading, sendMessage, error } = useChat();
  const { data: usage } = useAiUsage();
  const chatRemaining = usage?.chatRemaining ?? null;
  const isChatLimitReached = chatRemaining !== null && chatRemaining <= 0;

  const worldviewId = profile.worldviewId;
  const barLabel =
    worldviewId === 'arcane-terminal'
      ? 'ターミナルバー'
      : worldviewId === 'chronicle-campus'
        ? 'キャンパスカフェ'
        : worldviewId === 'neo-frontier-hub'
          ? 'オペレーションラウンジ'
          : 'バー';

  const expression = useMemo(
    () =>
      getExpressionForPartner({
        isLoading,
        messages,
        favorability: favorability ?? 0,
        itemJustGivenToPartner: false,
      }),
    [isLoading, messages, favorability]
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
        <div className="relative mb-4 w-80 max-h-[70vh] flex flex-col backdrop-blur-md border border-border text-foreground p-4 rounded-2xl rounded-tr-none shadow-2xl animate-fade-in-up" style={{ backgroundColor: 'var(--surface-strong)' }}>
          <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-border/70 mb-3">
            <PartnerAvatar
              variant={variant}
              expression={expression}
              className="w-14 h-14 object-contain shrink-0"
              alt="AIパートナー"
            />
            <p className="text-sm font-medium text-foreground">{barLabel}</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3">
            {messages.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">相棒があなたの話を待っています。何でも聞いてみましょう。</p>
            )}
            {messages
              .filter((msg) => msg.content.trim() !== '')
              .map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed wrap-break-word ${
                    msg.role === 'user' ? 'text-right ml-8' : 'text-left mr-8'
                  }`}
                >
                  <span
                    className={
                      msg.role === 'user'
                        ? 'inline-block px-3 py-1.5 rounded-lg rounded-tr-none border text-primary-foreground'
                        : 'inline-block px-3 py-1.5 rounded-lg rounded-tl-none border border-border text-foreground'
                    }
                    style={
                      msg.role === 'user'
                        ? {
                            backgroundColor: 'var(--partner-accent)',
                            borderColor: 'var(--partner-accent-soft)',
                          }
                        : { backgroundColor: 'var(--surface-soft)' }
                    }
                  >
                    {msg.content}
                  </span>
                </div>
              ))}
            {isLoading && (
              <div className="flex space-x-1 justify-start py-2">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--partner-accent)' }} />
                <div className="w-2 h-2 rounded-full animate-bounce delay-100" style={{ backgroundColor: 'var(--partner-accent)' }} />
                <div className="w-2 h-2 rounded-full animate-bounce delay-200" style={{ backgroundColor: 'var(--partner-accent)' }} />
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-destructive mb-2" role="alert">
              {error.message}
            </p>
          )}
          {chatRemaining !== null && (
            <p className="text-xs text-muted-foreground mb-2">
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
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
              disabled={isLoading || isChatLimitReached}
              aria-label="メッセージ入力"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim() || isChatLimitReached}
              className="px-4 py-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg text-sm font-medium text-primary-foreground transition-all active:scale-[0.98]"
              style={{ backgroundColor: 'var(--partner-accent)', boxShadow: '0 0 10px var(--partner-accent-soft)' }}
              aria-label="送信"
            >
              送信
            </button>
          </form>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 transform rotate-45 border-r border-b border-border pointer-events-none" style={{ backgroundColor: 'var(--surface-strong)' }} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-14 h-14 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        style={{ backgroundImage: 'linear-gradient(to right, var(--partner-accent), var(--partner-secondary))' }}
        aria-label={isOpen ? 'チャットを閉じる' : 'チャットを開く'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default PartnerWidget;
