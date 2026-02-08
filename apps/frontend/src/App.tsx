import React, { useState } from 'react';
import { AppMode, CharacterProfile, Genre, GenesisFormData } from '@skill-quest/shared';
import { generateCharacter } from '@/lib/api-client';
import { IntroStep, QuestionStep, LoadingStep } from '@/components/GenesisStep';
import ResultStep from '@/components/ResultStep';
import Dashboard from '@/components/Dashboard';
import LoginSignupForm from '@/components/LoginSignupForm';
import { useAuth } from '@/hooks/useAuth';

const App: React.FC = () => {
  const { isLoading, isAuthenticated, refetch } = useAuth();
  const [mode, setMode] = useState<AppMode>(AppMode.GENESIS);
  const [genesisStep, setGenesisStep] = useState<'INTRO' | 'QUESTIONS' | 'LOADING' | 'RESULT'>('INTRO');

  // Form State
  const [formData, setFormData] = useState<GenesisFormData>({
    name: '',
    goal: '',
    genre: Genre.FANTASY,
  });

  // Result State
  const [profile, setProfile] = useState<CharacterProfile | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setGenesisStep('LOADING');
    try {
      const result = await generateCharacter(formData);
      setProfile(result);
      setGenesisStep('RESULT');
    } catch (error) {
      console.error("Failed to generate", error);
      setGenesisStep('QUESTIONS');
    }
  };

  const handleCompleteGenesis = () => {
    setMode(AppMode.DASHBOARD);
  };

  // 認証状態: ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  // 認証状態: 未認証の場合はログイン/サインアップ画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-center text-slate-200 mb-6">Chronicle</h1>
          <LoginSignupForm onSuccess={refetch} />
        </div>
        <div className="p-4 text-center text-slate-600 text-xs mt-8">
          Chronicle v1.1.0 &bull; Powered by Workers AI
        </div>
      </div>
    );
  }

  // 認証済み: ダッシュボード
  if (mode === AppMode.DASHBOARD && profile) {
    return <Dashboard initialProfile={profile} />;
  }

  // Render Genesis Flow
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center p-4 z-10">
        {genesisStep === 'INTRO' && (
          <IntroStep onNext={() => setGenesisStep('QUESTIONS')} />
        )}

        {genesisStep === 'QUESTIONS' && (
          <QuestionStep 
            name={formData.name}
            goal={formData.goal}
            genre={formData.genre}
            onChange={handleInputChange}
            onNext={handleGenerate}
            isGenerating={false}
          />
        )}

        {genesisStep === 'LOADING' && (
           <LoadingStep />
        )}

        {genesisStep === 'RESULT' && profile && (
          <ResultStep profile={profile} onComplete={handleCompleteGenesis} />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-slate-600 text-xs z-10">
        Chronicle v1.1.0 &bull; Powered by Workers AI
      </div>
    </div>
  );
};

export default App;
