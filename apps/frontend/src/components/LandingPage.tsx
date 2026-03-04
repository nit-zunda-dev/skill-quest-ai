import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Gamepad2,
  Sparkles,
  ChevronRight,
  MessageCircle,
  ListTodo,
  Zap,
  Gift,
} from 'lucide-react';

export interface LandingPageProps {
  /** CTA またはログインクリック時にフォーム表示へ切り替える */
  onStartClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartClick }) => {
  return (
    <div
      data-testid="landing-page"
      className="min-h-full w-full flex flex-col bg-background text-foreground relative overflow-hidden"
    >
      {/* 背景: グリッド + 左側パープルグラデーション */}
      <div
        className="absolute inset-0 pointer-events-none aria-hidden"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none aria-hidden" style={{ background: 'linear-gradient(to bottom, var(--ui-glow-2), transparent 45%)' }} aria-hidden />
      <div className="absolute left-0 top-0 bottom-0 w-1/2 max-w-xl pointer-events-none aria-hidden" style={{ background: 'linear-gradient(to right, var(--ui-glow-1), transparent)' }} aria-hidden />

      <main className="flex flex-col flex-1 relative z-10">
        {/* ヘッダー */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8 md:px-10 lg:px-12 shrink-0">
          <div className="flex items-center gap-2">
            <Gamepad2 className="size-8 text-accent sm:size-9" aria-hidden />
            <span className="font-bold text-xl text-foreground tracking-tight sm:text-2xl">Skill Quest AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onStartClick}
              className="text-muted-foreground hover:text-foreground text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-2 py-1"
            >
              ログイン
            </button>
          </div>
        </header>

        {/* ヒーロー（1カラム・中央寄せ） */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 lg:px-12 xl:px-20 py-8 sm:py-10 w-full max-w-3xl mx-auto min-h-0">
          <section
            aria-label="ヒーロー"
            className="w-full min-w-0 space-y-6 sm:space-y-7 text-left flex flex-col justify-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-foreground leading-tight font-display">
              あなたの目標が
              <span className="block bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                物語になる
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg xl:text-xl leading-relaxed">
              目標を入力すれば、AIがクエストと物語を紡ぎ出す。クリアするたびに報酬と物語の続きが届く、
              一人ひとりのための目標達成新感覚ゲームアプリ
            </p>
            <Button
              onClick={onStartClick}
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg transition-all duration-300 rounded-lg px-8 py-6 text-lg sm:text-xl"
              style={{ boxShadow: '0 0 24px var(--ui-glow-1)' }}
            >
              <Sparkles className="size-5 sm:size-6 mr-2" aria-hidden />
              無料で今すぐ始める
              <ChevronRight className="size-5 sm:size-6 ml-1" aria-hidden />
            </Button>
          </section>
        </div>

        {/* このアプリでできること（下のスペース） */}
        <section
          aria-label="このアプリでできること"
          className="w-full border-t border-border py-12 sm:py-16 px-5 sm:px-8 md:px-10 lg:px-12 xl:px-20"
          style={{ backgroundColor: 'var(--surface-soft)' }}
        >
          <div className="max-w-[1600px] mx-auto space-y-10 sm:space-y-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              このアプリでできること
            </h2>

            {/* 世界観選択 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-3 p-5 rounded-xl border border-border" style={{ backgroundColor: 'var(--surface-strong)' }}>
                <div className="flex items-center justify-center size-12 rounded-xl bg-primary/20 text-primary">
                  <Sparkles className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  あなた専用の世界観を選べる
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  端末のような近未来感の「Arcane Terminal」、夜のキャンパスで学ぶ「Chronicle Campus」、宇宙ステーションのミッションハブ「Neo Frontier Hub」から、今の自分にしっくりくる世界観を選べます。
                </p>
              </div>
              <div className="flex flex-col gap-3 p-5 rounded-xl border border-border" style={{ backgroundColor: 'var(--surface-strong)' }}>
                <div className="flex items-center justify-center size-12 rounded-xl bg-accent/20 text-accent">
                  <ListTodo className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  現実の目標がクエストに変わる
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  「資格勉強」「英語」「ポートフォリオ作成」など、現実の目標を入力するだけで、AIが達成までの道のりをクエストとして自動分解。今日やることが、物語の1シーンとして並びます。
                </p>
              </div>
              <div className="flex flex-col gap-3 p-5 rounded-xl border border-border" style={{ backgroundColor: 'var(--surface-strong)' }}>
                <div className="flex items-center justify-center size-12 rounded-xl bg-primary/20 text-primary">
                  <Gift className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  クエストクリアごとにアイテム獲得
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  クエストをクリアするたびに、XPやゴールドに加えてユニークなアイテムがドロップ。どんな報酬が手に入るか、小さなガチャのようなワクワクがあります。
                </p>
              </div>
            </div>

            {/* アイテム利用 & グリモワール */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3 p-5 rounded-xl border border-border" style={{ backgroundColor: 'var(--surface-strong)' }}>
                <div className="flex items-center justify-center size-12 rounded-xl bg-accent/20 text-accent">
                  <Zap className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  集めたアイテムはいろんな用途に
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  獲得したアイテムは、セッション中の演出強化や、将来の機能拡張（バフ・コレクション・記念品など）として活用されていきます。単なるポイントではなく、「自分だけのコレクション」として残っていきます。
                </p>
              </div>
              <div className="flex flex-col gap-3 p-5 rounded-xl border border-border" style={{ backgroundColor: 'var(--surface-strong)' }}>
                <div className="flex items-center justify-center size-12 rounded-xl bg-primary/20 text-primary">
                  <MessageCircle className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  一日の終わりに、物語として振り返る
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  その日のクエストを終えたら、グリモワールを生成して一日の物語を記録。AIがセッションのハイライトを物語としてまとめてくれるので、「ただのToDo」ではなく、自分だけのストーリーログとして積み上がります。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
