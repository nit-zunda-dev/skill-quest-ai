import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, updateProfile } from '@/lib/api-client';

export default function AccountPage() {
  const { session, refetch } = useAuth();
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProfile();
        if (!cancelled) {
          setName(p.name);
          setImage(p.image ?? '');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '読み込みに失敗しました');
          if (session?.user?.name) setName(session.user.name);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const trimmedImage = image.trim();
      await updateProfile({
        name: name.trim(),
        image: trimmedImage === '' ? null : trimmedImage,
      });
      await refetch();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">読み込み中…</div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">ログイン中</p>
        <p className="text-foreground font-medium">{session?.user?.email}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="account-name" className="block text-sm font-medium mb-1">
            表示名
          </label>
          <input
            id="account-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
            minLength={1}
            maxLength={256}
          />
        </div>
        <div>
          <label htmlFor="account-image" className="block text-sm font-medium mb-1">
            プロフィール画像 URL（任意）
          </label>
          <input
            id="account-image"
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400">保存しました</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </form>
    </div>
  );
}
