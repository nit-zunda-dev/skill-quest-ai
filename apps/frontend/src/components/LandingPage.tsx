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
      className="min-h-full w-full flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden"
    >
      {/* 背景: グリッド + 左側パープルグラデーション */}
      <div
        className="absolute inset-0 pointer-events-none aria-hidden"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent pointer-events-none aria-hidden" aria-hidden />
      <div className="absolute left-0 top-0 bottom-0 w-1/2 max-w-xl bg-gradient-to-r from-violet-900/15 to-transparent pointer-events-none aria-hidden" aria-hidden />

      <main className="flex flex-col flex-1 relative z-10">
        {/* ヘッダー */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8 md:px-10 lg:px-12 shrink-0">
          <div className="flex items-center gap-2">
            <Gamepad2 className="size-8 text-sky-300/90 sm:size-9" aria-hidden />
            <span className="font-bold text-xl text-white tracking-tight sm:text-2xl">Skill Quest AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onStartClick}
              className="text-slate-200 hover:text-white text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded px-2 py-1"
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight font-display">
              退屈なTODO消化を、
              <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-violet-400 bg-clip-text text-transparent">
                ゲーム感覚に。
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg xl:text-xl leading-relaxed">
              「また三日坊主」と自己嫌悪するのはもう終わり。資格勉強もプログラミングも、ゲーム感覚で「今すぐ」レベルアップの快感を手に入れよう。
            </p>
            <Button
              onClick={onStartClick}
              size="lg"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-400/30 rounded-lg px-8 py-6 text-lg sm:text-xl"
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
          className="w-full border-t border-slate-800/80 bg-slate-900/30 py-12 sm:py-16 px-5 sm:px-8 md:px-10 lg:px-12 xl:px-20"
        >
          <div className="max-w-[1600px] mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 sm:mb-12">
              このアプリでできること
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-center size-12 rounded-xl bg-violet-500/20 text-violet-400">
                  <ListTodo className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-white text-base">目標を自動でクエスト(タスク)化</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  やることをRPGのクエストに自動で変えて管理。単純なToDoでは続かなかった学びも、ゲーム感覚で続けられます。
                </p>
              </div>
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Zap className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-white text-base">EXPで報酬感</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  一日の終わりにEXPを獲得。「今すぐ」レベルアップの快感を味わえます。
                </p>
              </div>
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-center size-12 rounded-xl bg-sky-500/20 text-sky-400">
                  <MessageCircle className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-white text-base">AIパートナーとの対話</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  AIパートナーと対話しながら、学習やタスクを進められます。一人で続けるより、一緒に進める体験を。
                </p>
              </div>
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-center size-12 rounded-xl bg-amber-500/20 text-amber-400">
                  <Gift className="size-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-white text-base">ランダムドロップ</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  クリアでレアアイテムゲット。飽きさせないガチャ要素で、毎日ちょっとしたワクワクを。
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
