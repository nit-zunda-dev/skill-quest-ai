import React from 'react';
import { CharacterProfile } from '@skill-quest/shared';
import { BookOpen, Crown } from 'lucide-react';

interface ResultStepProps {
  profile: CharacterProfile;
  onComplete: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({ profile, onComplete }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="text-center mb-10">
        <span className="text-primary text-sm font-semibold tracking-wider uppercase">キャラクター作成完了</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 mb-2">{profile.className}</h1>
        <p className="text-xl text-muted-foreground italic">{profile.title}</p>
      </div>

      <div className="max-w-2xl mx-auto mb-10">
        <div className="rounded-xl p-6 border border-border backdrop-blur-sm shadow-xl" style={{ backgroundColor: 'var(--surface-soft)' }}>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary" /> プロローグ
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary pl-4 py-2 rounded-r" style={{ backgroundColor: 'var(--interactive-soft)' }}>
              "{profile.prologue}"
            </p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full mt-6 group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground transition-all duration-200 bg-primary rounded-xl hover:bg-primary/90 hover:-translate-y-1"
          style={{ boxShadow: '0 0 25px var(--ui-glow-1)' }}
        >
          <Crown className="w-6 h-6 mr-2" />
          世界へ旅立つ
        </button>
      </div>
    </div>
  );
};

export default ResultStep;
