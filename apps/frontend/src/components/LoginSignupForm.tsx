/**
 * ログイン/サインアップUIコンポーネント（タスク 10.2）
 * - メール/パスワード入力フォーム
 * - ログインとサインアップの処理
 * - エラーメッセージとバリデーション表示
 */
import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';

type Mode = 'login' | 'signup';

const MIN_PASSWORD_LENGTH = 8;

interface LoginSignupFormProps {
  /** ログイン/サインアップ成功時に呼ばれる（認証状態の再取得用） */
  onSuccess?: () => void;
  /** 初期表示モード（URL 正規化後の値。Task 12.1, Req 5.3） */
  initialMode?: Mode;
}

const LoginSignupForm: React.FC<LoginSignupFormProps> = ({ onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = () => {
    setError(null);
    setValidationError(null);
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setValidationError('メールを入力してください');
      return false;
    }
    if (!password) {
      setValidationError('パスワードを入力してください');
      return false;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        setValidationError('名前を入力してください');
        return false;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setValidationError(`パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`);
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        if (result.error) {
          setError(result.error.message ?? 'ログインに失敗しました');
          return;
        }
        setPassword('');
        onSuccess?.();
      } else {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (result.error) {
          setError(result.error.message ?? 'サインアップに失敗しました');
          return;
        }
        setPassword('');
        setName('');
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    clearErrors();
    setPassword('');
    if (mode === 'login') setName('');
  };

  const displayError = error ?? validationError;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      {mode === 'signup' && (
        <div>
          <label htmlFor="auth-name" className="block text-sm font-medium text-slate-400 mb-1">
            名前
          </label>
          <input
            id="auth-name"
            type="text"
            placeholder="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-600"
            autoComplete="name"
          />
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="block text-sm font-medium text-slate-400 mb-1">
          メール
        </label>
        <input
          id="auth-email"
          type="email"
          placeholder="メール"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-600"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="auth-password" className="block text-sm font-medium text-slate-400 mb-1">
          パスワード
        </label>
        <input
          id="auth-password"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-600"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {displayError && (
        <p className="text-sm text-red-400" role="alert">
          {displayError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {mode === 'login' ? 'ログイン' : 'サインアップ'}
        </button>
        <button
          type="button"
          onClick={switchMode}
          className="w-full py-2 px-4 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          {mode === 'login' ? 'サインアップ' : 'ログイン'}
        </button>
      </div>
    </form>
  );
};

export default LoginSignupForm;
