/**
 * Genesis の URL 駆動ステップ表示（Task 10.1, Requirements 2.1）
 * /genesis/:step に応じてステップを表示し、遷移時に URL を更新する。戻る/進むでステップが復元される。
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { IntroStep, QuestionStep, LoadingStep } from '@/components/GenesisStep';
import ResultStep from '@/components/ResultStep';
import SuggestStep from '@/components/SuggestStep';
import { useGenesisFlow } from '@/contexts/GenesisFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { generateCharacter, normalizeProfileNumbers } from '@/lib/api-client';
import {
  GENESIS_STEP_SLUGS,
  getGenesisStepPath,
  PATH_GENESIS_INTRO,
  PATH_APP,
} from '@/lib/paths';
import { useQueryClient } from '@tanstack/react-query';
import type { GenesisStepSlug } from '@/lib/paths';

function normalizeStep(step: string | undefined): GenesisStepSlug {
  if (step && (GENESIS_STEP_SLUGS as readonly string[]).includes(step)) {
    return step as GenesisStepSlug;
  }
  return 'intro';
}

export function GenesisStepView() {
  const { step: paramStep } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formData, setFormData, profile, setProfile } = useGenesisFlow();
  const { session } = useAuth();
  const step = normalizeStep(paramStep);

  // 認証済みのとき名前を formData に同期（1回だけ）
  useEffect(() => {
    if (session?.user?.name != null && session.user.name !== '' && formData.name === '') {
      setFormData((prev) => ({ ...prev, name: session.user.name ?? '' }));
    }
  }, [session?.user?.name, formData.name, setFormData]);

  // loading ステップ表示中に API を実行（戻る/進むで loading に来た場合は既に profile があれば result へ）
  useEffect(() => {
    if (step !== 'loading') return;
    if (profile) {
      navigate(getGenesisStepPath('result'));
      return;
    }
    if (!formData.name) {
      navigate(PATH_GENESIS_INTRO);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await generateCharacter(formData);
        if (cancelled) return;
        const normalized = normalizeProfileNumbers(result);
        setProfile(normalized);
        navigate(getGenesisStepPath('result'));
      } catch (error) {
        console.error('Failed to generate character', error);
        if (!cancelled) navigate(getGenesisStepPath('questions'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, formData, profile, navigate, setProfile]);

  // 不正な step は intro へリダイレクト（すべての Hooks の後に配置）
  if (paramStep !== undefined && step !== paramStep) {
    return <Navigate to={PATH_GENESIS_INTRO} replace />;
  }

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    navigate(getGenesisStepPath('loading'));
  };

  const handleCompleteResult = () => {
    navigate(getGenesisStepPath('suggest'));
  };

  const handleCompleteSuggest = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    queryClient.invalidateQueries({ queryKey: ['ai', 'character'] });
    navigate(PATH_APP, { state: { fromGenesis: true, profile: profile ?? undefined } });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex-grow flex items-center justify-center p-4 z-10">
        {step === 'intro' && (
          <IntroStep onNext={() => navigate(getGenesisStepPath('questions'))} />
        )}

        {step === 'questions' && (
          <QuestionStep
            name={formData.name}
            goal={formData.goal}
            onChange={handleInputChange}
            onNext={handleGenerate}
            isGenerating={false}
          />
        )}

        {step === 'loading' && <LoadingStep />}

        {step === 'result' && profile && (
          <ResultStep profile={profile} onComplete={handleCompleteResult} />
        )}

        {step === 'suggest' && profile && (
          <SuggestStep profile={profile} onComplete={handleCompleteSuggest} />
        )}
      </div>

      <div className="p-4 text-center text-slate-600 text-xs z-10">
        Skill Quest AI v1.1.0 &bull; Powered by Workers AI
      </div>
    </div>
  );
}
