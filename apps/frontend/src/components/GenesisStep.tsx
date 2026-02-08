import React, { useState, useEffect } from 'react';
import { Genre } from '@skill-quest/shared';
import { ArrowRight, Wand2, Sword, Scroll, User, CheckCircle2 } from 'lucide-react';

export const IntroStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div className="text-center space-y-8 animate-fade-in">
    <div className="flex justify-center mb-6">
      <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
        <Scroll className="w-10 h-10 text-indigo-300" />
      </div>
    </div>
    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200">
      Chronicle
    </h1>
    <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
      毎日の習慣をRPGに変えよう。<br/>
      目標達成の道のりを、あなただけの物語として記録します。
    </p>
    <button
      onClick={onNext}
      className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
    >
      <span>冒険を始める</span>
      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
    </button>
  </div>
);

interface QuestionStepProps {
  name: string;
  goal: string;
  genre: Genre;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  isGenerating: boolean;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({ name, goal, genre, onChange, onNext, isGenerating }) => {
  const [activeField, setActiveField] = useState<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activeField < 2 && (e.target as HTMLInputElement).value) {
       setActiveField(prev => prev + 1);
    }
  };

  const isFormValid = name.length > 0 && goal.length > 0;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-center text-slate-200 mb-8">
        プロフィールの作成
      </h2>

      {/* Name: 表示専用（サインアップ時に入力済み） */}
      <div className={`transition-all duration-500 ${activeField >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <label className="block text-sm font-medium text-slate-400 mb-2">お名前</label>
        <div className="relative">
          <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={name || '読み込み中...'}
            readOnly
            aria-readonly="true"
            className="w-full bg-slate-800/30 border border-slate-700 text-slate-400 rounded-lg pl-10 pr-4 py-3 cursor-default"
          />
        </div>
      </div>

      {/* Goal Input */}
      <div className={`transition-all duration-500 delay-100 ${activeField >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <label className="block text-sm font-medium text-slate-400 mb-2">{name ? `${name}さん、現在の主な目標は？` : '現在の主な目標は？'}</label>
        <div className="relative">
          <Sword className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={goal}
            onChange={(e) => onChange('goal', e.target.value)}
            onFocus={() => setActiveField(1)}
            onKeyDown={handleKeyDown}
            placeholder="例：英語学習、ダイエット、副業など"
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Genre Selection */}
      <div className={`transition-all duration-500 delay-200 ${activeField >= 1 && goal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <label className="block text-sm font-medium text-slate-400 mb-2">好みの世界観を選択</label>
        <div className="grid grid-cols-1 gap-3">
          {Object.values(Genre).map((g) => (
            <button
              key={g}
              onClick={() => onChange('genre', g)}
              className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                genre === g
                  ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <span>{g}</span>
              {genre === g && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 flex justify-center">
        {isFormValid && (
          <button
            onClick={onNext}
            disabled={isGenerating}
            className="group relative inline-flex items-center justify-center px-8 py-3 w-full text-lg font-bold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02]"
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                キャラクター生成中...
              </>
            ) : (
              <>
                <span>決定して次へ</span>
                <Wand2 className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export const LoadingStep: React.FC = () => {
  const [message, setMessage] = useState("AIが世界を構築しています...");
  
  useEffect(() => {
    const messages = [
      "AIが世界を構築しています...",
      "クラス適性を分析中...",
      "ステータスを配分中...",
      "物語の導入を作成中...",
      "まもなく完了します..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setMessage(messages[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center space-y-8 animate-pulse">
       <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
           <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-purple-500 border-b-indigo-900 border-l-purple-900 rounded-full animate-spin"></div>
           <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center">
             <Wand2 className="w-8 h-8 text-indigo-400" />
           </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-indigo-200">{message}</h2>
    </div>
  );
};
