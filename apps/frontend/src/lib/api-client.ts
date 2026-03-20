const apiBase = import.meta.env?.VITE_API_URL || 'http://localhost:8787';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${apiBase}/api/profile`, { credentials: 'include' });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err?.message ?? `プロフィール取得に失敗しました (${res.status})`);
  }
  return (await res.json()) as UserProfile;
}

export async function updateProfile(data: { name?: string; image?: string | null }): Promise<UserProfile> {
  const res = await fetch(`${apiBase}/api/profile`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err?.message ?? `プロフィール更新に失敗しました (${res.status})`);
  }
  return (await res.json()) as UserProfile;
}

export async function deleteAccount(userId: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err?.message ?? `アカウント削除に失敗しました (${res.status})`);
  }
}
