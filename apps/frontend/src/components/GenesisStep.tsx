import React, { useState, useEffect } from 'react';
import { ArrowRight, Wand2, Sword, Scroll, User, Sparkles } from 'lucide-react';
import { WORLDVIEWS, type WorldviewId } from '@skill-quest/shared';

export const IntroStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div className="text-center space-y-8 animate-fade-in">
    <div className="flex justify-center mb-6">
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50" style={{ boxShadow: '0 0 20px var(--ui-glow-1)' }}>
        <Scroll className="w-10 h-10 text-primary" />
      </div>
    </div>
    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-linear-to-r from-primary via-foreground to-accent">
      Skill Quest AI
    </h1>
    <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
      あなただけの物語が、ここから始まる。<br/>
      目標を伝えれば、AIが世界とクエストを紡ぎ出します。
    </p>
    <button
      onClick={onNext}
      className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-primary-foreground transition-all duration-200 bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
      style={{ boxShadow: '0 0 18px var(--ui-glow-1)' }}
    >
      <span>冒険を始める</span>
      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
    </button>
  </div>
);

interface WorldviewStepProps {
  value: WorldviewId;
  onChange: (value: WorldviewId) => void;
  onNext: () => void;
}

export const WorldviewStep: React.FC<WorldviewStepProps> = ({ value, onChange, onNext }) => {
  const handleSelect = (id: WorldviewId) => {
    onChange(id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 animate-fade-in" data-testid="genesis-worldview-step">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full bg-secondary/70 text-muted-foreground border border-border">
          <Sparkles className="w-3 h-3 mr-1" />
          世界観の選択
        </span>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          冒険の舞台となる世界を選んでください
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          同じ目標でも、どんな世界で物語を進めるかで体験は少し変わります。あとから設定で変更することもできます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WORLDVIEWS.map((worldview) => {
          const selected = worldview.id === value;
          return (
            <button
              key={worldview.id}
              type="button"
              onClick={() => handleSelect(worldview.id)}
              className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-primary/70'
                  : 'border-border hover:border-accent/60'
              }`}
              style={{
                backgroundColor: 'var(--surface-soft)',
                boxShadow: selected ? '0 0 20px var(--ui-glow-1)' : 'none',
              }}
            >
              <div
                className="absolute inset-0 rounded-xl opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${worldview.bgGradientFrom}, ${worldview.bgGradientTo})`,
                }}
              />
              <div className="relative z-10 space-y-2 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{worldview.label}</span>
                  {selected && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                      選択中
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{worldview.description}</p>
                <p className="text-[11px] text-muted-foreground/90">{worldview.targetPersonaHint}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center px-8 py-3 text-sm md:text-base font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
          style={{ boxShadow: '0 0 18px var(--ui-glow-1)' }}
        >
          この世界で冒険を始める
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

interface QuestionStepProps {
  name: string;
  goal: string;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  isGenerating: boolean;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({ name, goal, onChange, onNext, isGenerating }) => {
  const [activeField, setActiveField] = useState<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activeField < 1 && (e.target as HTMLInputElement).value) {
       setActiveField(prev => prev + 1);
    }
  };

  const isFormValid = name.length > 0 && goal.length > 0;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-center text-foreground mb-8">
        プロフィールの作成
      </h2>

      {/* Name: 表示専用（サインアップ時に入力済み） */}
      <div className={`transition-all duration-500 ${activeField >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <label className="block text-sm font-medium text-muted-foreground mb-2">お名前</label>
        <div className="relative">
          <User className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={name || '読み込み中...'}
            readOnly
            aria-readonly="true"
            className="w-full bg-secondary/60 border border-border text-muted-foreground rounded-lg pl-10 pr-4 py-3 cursor-default"
          />
        </div>
      </div>

      {/* Goal Input */}
      <div className={`transition-all duration-500 delay-100 ${activeField >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <label className="block text-sm font-medium text-muted-foreground mb-2">{name ? `${name}さん、現在の主な目標は？` : '現在の主な目標は？'}</label>
        <div className="relative">
          <Sword className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={goal}
            onChange={(e) => onChange('goal', e.target.value)}
            onFocus={() => setActiveField(1)}
            onKeyDown={handleKeyDown}
            placeholder="例：英語学習、ダイエット、副業など"
            className="w-full bg-input border border-border text-foreground rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="pt-6 flex justify-center">
        {isFormValid && (
          <button
            onClick={onNext}
            disabled={isGenerating}
            className="group relative inline-flex items-center justify-center px-8 py-3 w-full text-lg font-bold text-primary-foreground transition-all duration-200 bg-linear-to-r from-primary to-accent rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02]"
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
  const [message, setMessage] = useState("あなたの物語の世界を紡いでいます...");
  
  useEffect(() => {
    const messages = [
      "あなたの物語の世界を紡いでいます...",
      "冒険者の素質を見極めています...",
      "クラスと称号を授けています...",
      "プロローグを執筆中...",
      "まもなく冒険が始まります..."
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
           <div className="absolute inset-0 border-4 border-t-primary border-r-accent border-b-primary/40 border-l-accent/40 rounded-full animate-spin"></div>
           <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center">
             <Wand2 className="w-8 h-8 text-primary" />
           </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground">{message}</h2>
    </div>
  );
};
