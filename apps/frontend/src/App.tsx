import React, { useState, useEffect } from 'react';
import { CharacterProfile, Genre, GenesisFormData } from '@skill-quest/shared';
import { generateCharacter } from '@/lib/api-client';
import { IntroStep, QuestionStep, LoadingStep } from '@/components/GenesisStep';
import ResultStep from '@/components/ResultStep';
import Dashboard from '@/components/Dashboard';
import LoginSignupForm from '@/components/LoginSignupForm';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/hooks/useAuth';
import { useGenesisOrProfile } from '@/hooks/useGenesisOrProfile';

const App: React.FC = () => {
  const { session, isLoading: authLoading, isAuthenticated, refetch } = useAuth();
  const genesisOrProfile = useGenesisOrProfile({ isAuthenticated, isLoading: authLoading });

  // Genesis 完了直後にダッシュボードへ渡すプロフィール（サインアップ時のみ使用）
  const [justCompletedProfile, setJustCompletedProfile] = useState<CharacterProfile | null>(null);

  const [showAuthForm, setShowAuthForm] = useState(false);
  const [genesisStep, setGenesisStep] = useState<'INTRO' | 'QUESTIONS' | 'LOADING' | 'RESULT'>('INTRO');
  const [formData, setFormData] = useState<GenesisFormData>({
    name: '',
    goal: '',
    genre: Genre.FANTASY,
  });
  const [profile, setProfile] = useState<CharacterProfile | null>(null);

  // 認証済み・Genesis 表示中はサインアップ時の名前を formData.name に同期（名前は1回だけ入力）
  useEffect(() => {
    if (isAuthenticated && session?.user?.name != null && session.user.name !== '') {
      setFormData(prev => (prev.name === '' ? { ...prev, name: session.user.name ?? '' } : prev));
    }
  }, [isAuthenticated, session?.user?.name]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setGenesisStep('LOADING');
    try {
      const result = await generateCharacter(formData);
      setProfile(result);
      setGenesisStep('RESULT');
    } catch (error) {
      console.error('Failed to generate character', error);
      // エラー時はQUESTIONSステップに戻す（ユーザーが再試行できるように）
      setGenesisStep('QUESTIONS');
      // エラーメッセージはgenerateCharacter内でフォールバックプロフィールを返すため、
      // ここではエラーをスローしない（フォールバックプロフィールが使用される）
    }
  };

  const handleCompleteGenesis = () => {
    if (profile) setJustCompletedProfile(profile);
  };

  // 認証: ローディング中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  // 未認証: ランディング or ログイン/サインアップ
  if (!isAuthenticated) {
    if (showAuthForm) {
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
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <LandingPage onStartClick={() => setShowAuthForm(true)} />
        <div className="p-4 text-center text-slate-600 text-xs mt-8">
          Chronicle v1.1.0 &bull; Powered by Workers AI
        </div>
      </div>
    );
  }

  // 認証済み: Genesis 完了直後 → ダッシュボード（サインアップ時のみ）
  if (justCompletedProfile) {
    return <Dashboard initialProfile={justCompletedProfile} />;
  }

  // Genesis の RESULT ステップ中は、genesisOrProfile の結果を無視して Genesis 画面を表示し続ける
  // （プロフィール生成後、useGenesisOrProfile が再評価されて dashboard を返しても、RESULT 画面を表示し続ける）
  const isShowingGenesisResult = genesisStep === 'RESULT';
  
  if (!isShowingGenesisResult) {
    // 認証済み: キャラ取得中 or エラー
    if (genesisOrProfile.kind === 'loading') {
      return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
          <div className="text-slate-400 animate-pulse">読み込み中...</div>
        </div>
      );
    }

    if (genesisOrProfile.kind === 'error') {
      return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
          <p className="text-red-400" role="alert">{genesisOrProfile.message}</p>
        </div>
      );
    }

    // 認証済み・キャラ生成済み → ダッシュボード（ログイン時）
    if (genesisOrProfile.kind === 'dashboard') {
      return <Dashboard initialProfile={genesisOrProfile.profile} />;
    }
  }

  // 認証済み・キャラ未生成 → Genesis（サインアップ時のみここに来る）
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

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

        {genesisStep === 'LOADING' && <LoadingStep />}

        {genesisStep === 'RESULT' && profile && (
          <ResultStep profile={profile} onComplete={handleCompleteGenesis} />
        )}
      </div>

      <div className="p-4 text-center text-slate-600 text-xs z-10">
        Chronicle v1.1.0 &bull; Powered by Workers AI
      </div>
    </div>
  );
};

export default App;
