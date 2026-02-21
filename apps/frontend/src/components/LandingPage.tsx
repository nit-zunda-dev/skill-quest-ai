import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LandingPageProps {
  /** CTA クリック時にフォーム表示へ切り替える */
  onStartClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartClick }) => {
  return (
    <div data-testid="landing-page" className="min-h-screen flex flex-col items-center justify-center p-4 gap-12 relative">
      <main className="contents">
        {/* 報酬感を補強する軽いアクセント（Req 3.3） */}
        <div
        className="absolute inset-0 overflow-hidden pointer-events-none aria-hidden"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-400/5 rounded-full blur-2xl animate-pulse duration-2000" />
      </div>

      <section
        aria-label="ヒーロー"
        className="w-full max-w-md text-center space-y-6 relative z-10"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-display">
          資格取得や自己研鑽を楽しく
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          ゲーム感覚。単純なToDoじゃない。
        </p>
        <Button
          onClick={onStartClick}
          size="lg"
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all duration-300 hover:shadow-indigo-500/25"
        >
          冒険を始める
        </Button>
      </section>

      <section
        aria-label="価値提案"
        className="w-full max-w-2xl space-y-4 relative z-10"
      >
        <h2 className="text-lg font-semibold text-slate-200 text-center">
          できること
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="bg-slate-800/80 border-slate-700 border-indigo-500/20 transition-colors duration-300 hover:border-indigo-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-100">
                RPG風クエストでタスク管理
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              やることをクエストに変えて、ゲーミフィケーションで楽しく続けられます。単純なToDoリストでは続かなかった学びも、前向きに。
            </CardContent>
          </Card>
          <Card className="bg-slate-800/80 border-slate-700 border-indigo-500/20 transition-colors duration-300 hover:border-indigo-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-100">
                資格・IT学習を続ける
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              資格習得やエンジニア学習を、ゲーム感覚の自己研鑽として。続けたい気持ちを一緒に応援します。
            </CardContent>
          </Card>
        </div>
      </section>
      </main>
    </div>
  );
};

export default LandingPage;
