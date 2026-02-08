import React from 'react';
import { CharacterProfile } from '@skill-quest/shared';
import StatsChart from './RadarChart';
import { Shield, Zap, BookOpen, Crown } from 'lucide-react';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        
        {/* Left Column: Stats & Skill */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 backdrop-blur-sm shadow-xl">
             <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-400" /> ステータス
             </h3>
             <StatsChart stats={profile.stats} color={profile.themeColor || '#8884d8'} />
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 backdrop-blur-sm shadow-xl flex items-center justify-between">
             <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">固有スキル</h3>
               <p className="text-xl font-bold text-indigo-200 mt-1">{profile.startingSkill}</p>
             </div>
             <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {/* Right Column: Prologue & Confirmation */}
        <div className="space-y-6 flex flex-col">
           <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 backdrop-blur-sm shadow-xl flex-grow">
             <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-indigo-400" /> プロローグ
             </h3>
             <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-900/10 rounded-r">
                  "{profile.prologue}"
                </p>
             </div>
             <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-center space-x-8 text-slate-400 text-sm">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-white text-lg">{profile.stats.strength}</span>
                  <span>筋力</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-white text-lg">{profile.stats.intelligence}</span>
                  <span>知力</span>
                </div>
                 <div className="flex flex-col items-center">
                  <span className="font-bold text-white text-lg">{profile.stats.charisma}</span>
                  <span>魅力</span>
                </div>
             </div>
           </div>

           <button
             onClick={onComplete}
             className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:-translate-y-1"
           >
             <Crown className="w-6 h-6 mr-2" />
             世界へ旅立つ
           </button>
        </div>
      </div>
    </div>
  );
};

export default ResultStep;
