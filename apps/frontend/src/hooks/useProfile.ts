/**
 * プロフィール取得・更新用カスタムフック（タスク 8.4）
 * - useQuery でプロフィールを取得
 * - useMutation でプロフィールを更新
 * - Hono RPC クライアントで型安全にフェッチ
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';

const PROFILE_QUERY_KEY = ['profile'] as const;

export type Profile = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export type UpdateProfileInput = {
  name?: string;
  image?: string | null;
};

type ProfileClient = {
  api: {
    profile: {
      $get: () => Promise<Response>;
      $patch: (opts: { json: UpdateProfileInput }) => Promise<Response>;
    };
  };
};

async function fetchProfile(): Promise<Profile> {
  const res = await (client as ProfileClient).api.profile.$get();
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to fetch profile: ${res.status}`);
  }
  return res.json();
}

async function updateProfileFn(input: UpdateProfileInput): Promise<Profile> {
  const res = await (client as ProfileClient).api.profile.$patch({ json: input });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to update profile: ${res.status}`);
  }
  return res.json();
}

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
  });

  const mutation = useMutation({
    mutationFn: updateProfileFn,
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
    },
  });

  return {
    ...query,
    updateProfile: mutation.mutate,
    isPending: mutation.isPending,
  };
}
