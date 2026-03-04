/**
 * バーページ。パートナーとのチャットとアイテム付与を行う。
 * サイバーパンク酒場風UI: 全面背景・パートナー＋チャット（下部中央）。
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { MessageCircle, Gift, Heart } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAiUsage } from '@/hooks/useAiUsage';
import { usePartnerVariant } from '@/contexts/PartnerVariantContext';
import { usePartnerFavorability } from '@/hooks/usePartnerBar';
import { PartnerAvatar } from '@/components/PartnerAvatar';
import { GiveItemModal } from '@/components/GiveItemModal';
import { getExpressionForPartner } from '@/lib/partner-expression-context';
import { useProfile } from '@/contexts/ProfileContext';

const BAR_BG_PATH = '/images/partner/bar-bg.png';

const ITEM_JUST_GIVEN_DURATION_MS = 30000;
const FAVORABILITY_MAX = 1000;

export default function PartnerPage() {
  const { profile } = useProfile();
  const [inputValue, setInputValue] = useState('');
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [itemJustGivenToPartnerUntil, setItemJustGivenToPartnerUntil] = useState(0);
  const { variant } = usePartnerVariant();
  const { data: favorability } = usePartnerFavorability();
  const { messages, isLoading, sendMessage, error } = useChat();
  const { data: usage } = useAiUsage();
  const chatRemaining = usage?.chatRemaining ?? null;
  const isChatLimitReached = chatRemaining !== null && chatRemaining <= 0;

  const itemJustGivenToPartner = Date.now() < itemJustGivenToPartnerUntil;

  const worldviewId = profile.worldviewId;
  const barTitle =
    worldviewId === 'arcane-terminal'
      ? 'ターミナルバー'
      : worldviewId === 'chronicle-campus'
        ? 'キャンパスカフェ'
        : worldviewId === 'neo-frontier-hub'
          ? 'オペレーションラウンジ'
          : 'バー';

  const barTagline =
    worldviewId === 'arcane-terminal'
      ? 'ネオンに揺れるカウンターで、相棒がログインを待っている。'
      : worldviewId === 'chronicle-campus'
        ? '静かなカウンター席で、勉強の合間の一息とおしゃべりを。'
        : worldviewId === 'neo-frontier-hub'
          ? '作戦会議の合間に、短い一言を交わす作戦ラウンジ。'
          : '相棒があなたの話を待っています。';

  const handleGiveSuccess = useCallback(
    (target: 'partner' | 'pet', grantedRarity?: string | null, itemName?: string) => {
      if (target === 'partner') {
        setItemJustGivenToPartnerUntil(Date.now() + ITEM_JUST_GIVEN_DURATION_MS);
        if (itemName && !isChatLimitReached && !isLoading) {
          sendMessage(`${itemName}を渡したよ`);
        }
      }
    },
    [isChatLimitReached, isLoading, sendMessage]
  );

  useEffect(() => {
    if (itemJustGivenToPartnerUntil <= 0) return;
    const t = setTimeout(() => setItemJustGivenToPartnerUntil(0), ITEM_JUST_GIVEN_DURATION_MS);
    return () => clearTimeout(t);
  }, [itemJustGivenToPartnerUntil]);

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
        className="absolute inset-0 bg-center bg-no-repeat bg-background"
        style={{
          backgroundImage: `url(${BAR_BG_PATH})`,
          backgroundSize: 'contain',
          imageRendering: 'crisp-edges',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'var(--surface-strong)' }} aria-hidden />

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
          <div className="w-full md:min-w-[320px] md:max-w-xl max-h-[38vh] md:max-h-[44vh] flex flex-col rounded-2xl overflow-hidden border border-border backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)] order-2" style={{ backgroundColor: 'var(--surface-strong)' }}>
            <div className="shrink-0 px-3 py-2 border-b border-border/70 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-foreground truncate">{barTitle}</h2>
                <p className="text-xs text-muted-foreground truncate">
                  {barTagline}
                </p>
                <div className="mt-1.5 flex items-center gap-2 min-w-0" aria-label="パートナー好感度">
                  <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--partner-secondary)' }}>
                    <Heart className="w-3.5 h-3.5" aria-hidden />
                    好感度
                  </span>
                  <div className="flex-1 min-w-0 max-w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (favorability ?? 0) / FAVORABILITY_MAX * 100)}%`, backgroundImage: 'linear-gradient(to right, var(--partner-secondary), var(--partner-accent))' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {favorability ?? 0}/{FAVORABILITY_MAX}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGiveModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{
                    borderColor: 'var(--partner-secondary)',
                    backgroundColor: 'var(--interactive-soft)',
                    color: 'var(--partner-secondary)',
                  }}
                  aria-label="アイテムを渡す"
                >
                  <Gift className="w-4 h-4" />
                  アイテムを渡す
                </button>
                {chatRemaining !== null && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium shrink-0"
                  style={{
                    borderColor: 'var(--partner-accent)',
                    backgroundColor: 'var(--interactive-soft)',
                    color: 'var(--partner-accent)',
                  }}
                  title={isChatLimitReached ? '本日のチャット回数を使い切りました' : `チャット 残り${chatRemaining}回`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
                  <span>
                    {isChatLimitReached ? '0' : chatRemaining}
                    <span className="text-muted-foreground font-normal ml-0.5">回</span>
                  </span>
                </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
              {messages.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground">何でも聞いてみましょう。</p>
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
                          ? 'inline-block text-primary-foreground px-4 py-2 rounded-lg rounded-tr-none max-w-[85%] border'
                          : 'inline-block px-4 py-2 rounded-lg rounded-tl-none max-w-[85%] border border-border text-foreground'
                      }
                      style={
                        msg.role === 'user'
                          ? {
                              backgroundColor: 'var(--partner-accent)',
                              borderColor: 'var(--partner-accent-soft)',
                              boxShadow: '0 0 12px var(--partner-accent-soft)',
                            }
                          : { backgroundColor: 'var(--surface-soft)' }
                      }
                    >
                      <span className="text-sm leading-relaxed wrap-break-word">{msg.content}</span>
                    </span>
                  </div>
                ))}
              {isLoading && (
                <div className="flex items-center gap-2 py-2 animate-fade-in-up">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--partner-accent)' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce delay-100" style={{ backgroundColor: 'var(--partner-accent)' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce delay-200" style={{ backgroundColor: 'var(--partner-accent)' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">考え中…</span>
                </div>
              )}
            </div>

            {error && (
              <p className="px-3 py-1 text-xs text-destructive" role="alert">
                {error.message}
              </p>
            )}

            {chatRemaining !== null && isChatLimitReached && (
              <p className="px-3 py-1 text-xs text-muted-foreground">
                本日のチャット回数を使い切りました。
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="px-3 py-2 border-t border-border/70 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="メッセージを入力"
                className="flex-1 min-w-0 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-shadow"
                disabled={isLoading || isChatLimitReached}
                aria-label="メッセージ入力"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || isChatLimitReached}
                className="px-4 py-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg text-sm font-medium text-primary-foreground transition-all active:scale-[0.98]"
                style={{ backgroundColor: 'var(--partner-accent)', boxShadow: '0 0 12px var(--partner-accent-soft)' }}
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
        allowedTargets={['partner']}
      />
    </div>
  );
}
