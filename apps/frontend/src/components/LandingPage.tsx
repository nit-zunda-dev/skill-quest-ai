import React from 'react';
import { Button } from '@/components/ui/button';

export interface LandingPageProps {
  /** CTA クリック時にフォーム表示へ切り替える */
  onStartClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartClick }) => {
  return (
    <div data-testid="landing-page" className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-xl font-bold text-slate-200">Chronicle</h1>
        <p className="text-slate-400 text-sm">ゲーム感覚で自己研鑽を続けよう</p>
        <Button onClick={onStartClick} size="lg">
          冒険を始める
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
