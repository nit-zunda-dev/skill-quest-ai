/**
 * AIパートナーページ。チャットをフルページで表示（浮動ウィジェットの内容を流用）。
 * サイバーパンク酒場風UI: 全面背景・立ち絵＋チャット2カラム・ネオン配色・ゲームUX。
 */
import React, { useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAiUsage } from '@/hooks/useAiUsage';
import { usePartnerVariant } from '@/contexts/PartnerVariantContext';
import { PartnerAvatar } from '@/components/PartnerAvatar';
import { getExpressionForPartner } from '@/lib/partner-expression-context';

const BAR_BG_PATH = '/images/partner/bar-bg.png';

export default function PartnerPage() {
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
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* 背景: メインコンテンツ領域内のみ（サイドナビには侵食しない） */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BAR_BG_PATH})` }}
        aria-hidden
      />
      {/* 可読性のための半透明オーバーレイ */}
      <div className="absolute inset-0 bg-slate-950/50 pointer-events-none" aria-hidden />

      {/* コンテンツ: バーの手前に自然に配置（下寄せ・余白で一体感） */}
      <div className="relative z-10 mt-auto w-full max-w-6xl mx-auto px-4 md:px-6 pb-6 md:pb-8">
        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
          {/* パートナー: バーに立つ相棒（左下・立ち絵サイズ / モバイルは上に表示） */}
          <div className="shrink-0 flex justify-center md:justify-start items-end order-1">
            <PartnerAvatar
              variant={variant}
              expression={expression}
              className="w-36 sm:w-44 md:w-52 max-h-[36vh] md:max-h-[44vh] object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              alt="AIパートナー"
            />
          </div>

          {/* チャット: 相棒との会話エリア（高さ・幅を控えめに） */}
          <div className="w-full md:min-w-[320px] md:max-w-xl max-h-[38vh] md:max-h-[44vh] flex flex-col rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-800/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)] order-2">
          {/* ヘッダー: タイトル + HUD風残り回数（コンパクト） */}
          <div className="shrink-0 px-3 py-2 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">AIパートナー</h2>
              <p className="text-xs text-slate-400 truncate">
                相棒があなたの話を待っています。
              </p>
            </div>
            {chatRemaining !== null && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-500/40 bg-slate-900/80 text-cyan-300 text-xs font-medium shrink-0"
                title={isChatLimitReached ? '本日のチャット回数を使い切りました' : `チャット 残り${chatRemaining}回`}
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
                <span>
                  {isChatLimitReached ? '0' : chatRemaining}
                  <span className="text-slate-400 font-normal ml-0.5">回</span>
                </span>
              </div>
            )}
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && !isLoading && (
              <p className="text-xs text-slate-500">何でも聞いてみましょう。</p>
            )}
            {messages
              .filter((msg) => msg.content.trim() !== '')
              .map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                >
                  <span
                    className={
                      msg.role === 'user'
                        ? 'inline-block bg-cyan-500/80 text-white px-4 py-2 rounded-lg rounded-tr-none max-w-[85%] border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'inline-block bg-slate-800/90 text-slate-100 px-4 py-2 rounded-lg rounded-tl-none max-w-[85%] border border-cyan-500/20'
                    }
                  >
                    <span className="text-sm leading-relaxed break-words">{msg.content}</span>
                  </span>
                </div>
              ))}
            {isLoading && (
              <div className="flex items-center gap-2 py-2 animate-fade-in-up">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                </div>
                <span className="text-xs text-slate-500">考え中…</span>
              </div>
            )}
          </div>

          {error && (
            <p className="px-3 py-1 text-xs text-red-400" role="alert">
              {error.message}
            </p>
          )}

          {chatRemaining !== null && isChatLimitReached && (
            <p className="px-3 py-1 text-xs text-slate-400">
              本日のチャット回数を使い切りました。
            </p>
          )}

          {/* 入力フォーム */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-2 border-t border-cyan-500/20 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="メッセージを入力"
              className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-shadow"
              disabled={isLoading || isChatLimitReached}
              aria-label="メッセージ入力"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim() || isChatLimitReached}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:pointer-events-none rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98] shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              aria-label="送信"
            >
              送信
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
