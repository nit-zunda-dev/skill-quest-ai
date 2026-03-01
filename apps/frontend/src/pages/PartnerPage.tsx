/**
 * バーページ。パートナーとペットを同画面に配置し、チャット・アイテム付与を行う。
 * サイバーパンク酒場風UI: 全面背景・ペット（左上）・パートナー＋チャット（下部中央）。
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { MessageCircle, Gift, Heart } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAiUsage } from '@/hooks/useAiUsage';
import { usePartnerVariant } from '@/contexts/PartnerVariantContext';
import { useLastPetRarity, usePartnerFavorability } from '@/hooks/usePartnerBar';
import { PartnerAvatar } from '@/components/PartnerAvatar';
import { PetAvatar } from '@/components/PetAvatar';
import { GiveItemModal } from '@/components/GiveItemModal';
import { getExpressionForPartner } from '@/lib/partner-expression-context';

const BAR_BG_PATH = '/images/partner/bar-bg.png';

const ITEM_JUST_GIVEN_DURATION_MS = 30000;
const FAVORABILITY_MAX = 1000;

/** ペットにアイテムを渡したときの吹き出し文言（レアリティ別） */
const PET_BUBBLE_BY_RARITY: Record<string, { main: string; sub: string }> = {
  common: { main: 'もらった！', sub: 'ありがとう' },
  rare: { main: 'もらった！', sub: '嬉しい…' },
  'super-rare': { main: 'もらった！キラキラ', sub: 'すごいの…！' },
  'ultra-rare': { main: 'もらった！キラキラ', sub: '最高…！！' },
  legend: { main: 'もらった！キラキラ', sub: '一生の宝物…！' },
};
const PET_BUBBLE_DEFAULT = { main: 'ありがとう！', sub: '嬉しい…' };

export default function PartnerPage() {
  const [inputValue, setInputValue] = useState('');
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [itemJustGivenToPartnerUntil, setItemJustGivenToPartnerUntil] = useState(0);
  const [itemJustGivenToPetUntil, setItemJustGivenToPetUntil] = useState(0);
  const [itemJustGivenToPetRarity, setItemJustGivenToPetRarity] = useState<string | null>(null);
  const { variant } = usePartnerVariant();
  const { data: lastPetRarity } = useLastPetRarity();
  const { data: favorability } = usePartnerFavorability();
  const { messages, isLoading, sendMessage, error } = useChat();
  const { data: usage } = useAiUsage();
  const chatRemaining = usage?.chatRemaining ?? null;
  const isChatLimitReached = chatRemaining !== null && chatRemaining <= 0;

  const itemJustGivenToPartner = Date.now() < itemJustGivenToPartnerUntil;
  const itemJustGivenToPet = Date.now() < itemJustGivenToPetUntil;

  const handleGiveSuccess = useCallback((target: 'partner' | 'pet', grantedRarity?: string | null) => {
    if (target === 'partner') setItemJustGivenToPartnerUntil(Date.now() + ITEM_JUST_GIVEN_DURATION_MS);
    if (target === 'pet') {
      setItemJustGivenToPetUntil(Date.now() + ITEM_JUST_GIVEN_DURATION_MS);
      setItemJustGivenToPetRarity(grantedRarity ?? null);
    }
  }, []);

  useEffect(() => {
    if (itemJustGivenToPartnerUntil <= 0) return;
    const t = setTimeout(() => setItemJustGivenToPartnerUntil(0), ITEM_JUST_GIVEN_DURATION_MS);
    return () => clearTimeout(t);
  }, [itemJustGivenToPartnerUntil]);

  useEffect(() => {
    if (itemJustGivenToPetUntil <= 0) return;
    const t = setTimeout(() => {
      setItemJustGivenToPetUntil(0);
      setItemJustGivenToPetRarity(null);
    }, ITEM_JUST_GIVEN_DURATION_MS);
    return () => clearTimeout(t);
  }, [itemJustGivenToPetUntil]);

  const petBubbleMessage = itemJustGivenToPet
    ? (PET_BUBBLE_BY_RARITY[itemJustGivenToPetRarity ?? ''] ?? PET_BUBBLE_DEFAULT)
    : null;

  const expression = useMemo(
    () =>
      getExpressionForPartner({
        isLoading,
        messages,
        favorability: favorability ?? 0,
        itemJustGivenToPartner,
      }),
    [isLoading, messages, favorability, itemJustGivenToPartner]
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
      {/* バー背景: 全体が画面に収まるよう contain、はみ出し部分は暗い色で埋める。ピクセルアートのため拡大時もくっきり表示 */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-[#0c0714]"
        style={{
          backgroundImage: `url(${BAR_BG_PATH})`,
          backgroundSize: 'contain',
          imageRendering: 'crisp-edges',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-slate-950/50 pointer-events-none" aria-hidden />

      {/* ペット: 左上に固定配置（全画面で視認しやすい） */}
      <div
        className="absolute z-10 top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 flex flex-col items-start justify-start gap-0 pointer-events-none"
        aria-hidden
      >
        {itemJustGivenToPet && petBubbleMessage && (
          <div
            className="mb-1 px-3 py-2 rounded-lg border border-cyan-500/50 bg-slate-900/95 backdrop-blur-sm shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-fade-in-up text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-cyan-200 whitespace-nowrap">{petBubbleMessage.main}</p>
            <p className="text-xs text-slate-400 mt-0.5">{petBubbleMessage.sub}</p>
          </div>
        )}
        <PetAvatar
          lastGrantedRarity={lastPetRarity ?? null}
          className="w-24 sm:w-28 md:w-32 lg:w-40 max-h-[20vh] sm:max-h-[24vh] lg:max-h-[28vh] object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] [background:transparent]"
          alt="ペット"
        />
      </div>

      <div className="relative z-10 mt-auto w-full max-w-6xl mx-auto px-4 md:px-6 pb-6 md:pb-8">
        <div className="flex flex-col md:flex-row items-end justify-center md:justify-center gap-6 md:gap-8">
          {/* パートナー: バーに立つ相棒 */}
          <div className="shrink-0 flex justify-center items-end order-1">
            <PartnerAvatar
              variant={variant}
              expression={expression}
              className="w-36 sm:w-44 md:w-52 max-h-[36vh] md:max-h-[44vh] object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              alt="AIパートナー"
            />
          </div>

          {/* チャット: 相棒との会話エリア */}
          <div className="w-full md:min-w-[320px] md:max-w-xl max-h-[38vh] md:max-h-[44vh] flex flex-col rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-800/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)] order-2">
            <div className="shrink-0 px-3 py-2 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-white truncate">バー</h2>
                <p className="text-xs text-slate-400 truncate">
                  相棒があなたの話を待っています。
                </p>
                <div className="mt-1.5 flex items-center gap-2 min-w-0" aria-label="パートナー好感度">
                  <span className="flex items-center gap-1 text-xs text-fuchsia-300 shrink-0">
                    <Heart className="w-3.5 h-3.5" aria-hidden />
                    好感度
                  </span>
                  <div className="flex-1 min-w-0 max-w-24 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (favorability ?? 0) / FAVORABILITY_MAX * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums shrink-0">
                    {favorability ?? 0}/{FAVORABILITY_MAX}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGiveModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-fuchsia-500/40 bg-slate-900/80 text-fuchsia-300 text-xs font-medium hover:bg-fuchsia-500/20 transition-colors"
                  aria-label="アイテムを渡す"
                >
                  <Gift className="w-4 h-4" />
                  アイテムを渡す
                </button>
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
            </div>

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

      <GiveItemModal
        open={giveModalOpen}
        onClose={() => setGiveModalOpen(false)}
        onGiveSuccess={handleGiveSuccess}
      />
    </div>
  );
}
