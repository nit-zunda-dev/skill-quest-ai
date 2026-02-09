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
        <span className="text-indigo-400 text-sm font-semibold tracking-wider uppercase">キャラクター作成完了</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2 mb-2">{profile.className}</h1>
        <p className="text-xl text-slate-400 italic">{profile.title}</p>
      </div>

      <div className="max-w-2xl mx-auto mb-10">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 backdrop-blur-sm shadow-xl">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-400" /> プロローグ
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-900/10 rounded-r">
              "{profile.prologue}"
            </p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full mt-6 group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:-translate-y-1"
        >
          <Crown className="w-6 h-6 mr-2" />
          世界へ旅立つ
        </button>
      </div>
    </div>
  );
};

export default ResultStep;
