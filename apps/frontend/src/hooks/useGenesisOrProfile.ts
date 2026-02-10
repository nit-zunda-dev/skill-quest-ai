/**
 * 認証済みユーザーの「Genesis 表示すべきか / 保存済みプロフィール」を取得するフック。
 * - キャラ未生成（サインアップ直後）→ Genesis を表示
 * - キャラ生成済み（ログイン時）→ 保存済みプロフィールを取得して Dashboard 用に返す
 */
import { useQuery } from '@tanstack/react-query';
import type { CharacterProfile } from '@skill-quest/shared';
import { useAiUsage } from '@/hooks/useAiUsage';
import { getCharacterProfile } from '@/lib/api-client';

const CHARACTER_QUERY_KEY = ['ai', 'character'] as const;

export type GenesisOrProfileState =
  | { kind: 'loading' }
  | { kind: 'genesis' }
  | { kind: 'dashboard'; profile: CharacterProfile }
  | { kind: 'error'; message: string };

interface UseGenesisOrProfileOptions {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useGenesisOrProfile({ isAuthenticated, isLoading: authLoading }: UseGenesisOrProfileOptions): GenesisOrProfileState {
  const { data: usage, isLoading: usageLoading, isError: usageError } = useAiUsage({
    enabled: isAuthenticated,
  });

  const characterGenerated = usage?.characterGenerated ?? false;
  const shouldFetchProfile = isAuthenticated && characterGenerated;

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: CHARACTER_QUERY_KEY,
    queryFn: getCharacterProfile,
    enabled: shouldFetchProfile,
  });

  if (authLoading || !isAuthenticated) {
    return { kind: 'loading' };
  }

  if (usageLoading) {
    return { kind: 'loading' };
  }

  // usage 取得失敗（401・タイムアウト・ネットワーク等）→ Genesis に進めてサインアップ完了を優先
  if (usageError) {
    return { kind: 'genesis' };
  }

  // キャラ未生成 → サインアップ時のみここ（Genesis 表示）
  if (!characterGenerated) {
    return { kind: 'genesis' };
  }

  if (profileLoading) {
    return { kind: 'loading' };
  }

  if (profileError || profile == null) {
    return { kind: 'error', message: 'キャラクター情報の取得に失敗しました。' };
  }

  return { kind: 'dashboard', profile };
}
