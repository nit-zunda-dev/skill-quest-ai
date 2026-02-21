import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LandingPageProps {
  /** CTA クリック時にフォーム表示へ切り替える */
  onStartClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartClick }) => {
  return (
    <div data-testid="landing-page" className="min-h-screen flex flex-col items-center justify-center p-4 gap-12">
      <section
        aria-label="ヒーロー"
        className="w-full max-w-md text-center space-y-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-display">
          タスクがクエストになる。
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          ゲーム感覚で自己研鑽を続けよう。単純なToDoじゃない、続く学び。
        </p>
        <Button onClick={onStartClick} size="lg" className="w-full sm:w-auto">
          冒険を始める
        </Button>
      </section>

      <section
        aria-label="価値提案"
        className="w-full max-w-2xl space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-200 text-center">
          Chronicle でできること
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-100">
                RPG風クエストでタスク管理
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              やることをクエストに変えて、ゲーミフィケーションで楽しく続けられます。単純なToDoリストでは続かなかった学びも、前向きに。
            </CardContent>
          </Card>
          <Card className="bg-slate-800/80 border-slate-700">
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
    </div>
  );
};

export default LandingPage;
