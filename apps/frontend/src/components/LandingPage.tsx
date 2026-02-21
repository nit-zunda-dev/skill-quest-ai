import React from 'react';
import { Button } from '@/components/ui/button';

export interface LandingPageProps {
  /** CTA クリック時にフォーム表示へ切り替える */
  onStartClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartClick }) => {
  return (
    <div data-testid="landing-page" className="min-h-screen flex flex-col items-center justify-center p-4">
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
    </div>
  );
};

export default LandingPage;
