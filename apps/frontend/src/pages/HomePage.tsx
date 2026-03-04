/**
 * ホーム（ダッシュボード要約）。各機能へのクイックアクションとサマリ。
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, Scroll, MessageCircle, Package, PawPrint } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useQuests } from '@/hooks/useQuests';
import { PATH_APP_QUESTS, PATH_APP_GRIMOIRE, PATH_APP_PARTNER, PATH_APP_PET, PATH_APP_ITEMS } from '@/lib/paths';

const links = [
  { to: PATH_APP_QUESTS, label: 'タスクボード', icon: ListTodo, description: 'クエストの追加・完了・管理' },
  { to: PATH_APP_GRIMOIRE, label: 'グリモワール', icon: Scroll, description: '冒険の記録を生成・閲覧' },
  { to: PATH_APP_PARTNER, label: 'バー（パートナー）', icon: MessageCircle, description: 'バーでAIパートナーと会話する' },
  { to: PATH_APP_PET, label: 'ペット', icon: PawPrint, description: 'ペットにアイテムを渡して仲良くなる' },
  { to: PATH_APP_ITEMS, label: '獲得アイテム', icon: Package, description: '獲得したアイテム一覧' },
];

export default function HomePage() {
  const { profile } = useProfile();
  const { data: serverTasks = [], isLoading: questsLoading } = useQuests();
  const todoCount = serverTasks.filter((t) => (t.status || (t.completed ? 'done' : 'todo')) !== 'done').length;
  const doneCount = serverTasks.filter((t) => (t.status || (t.completed ? 'done' : 'todo')) === 'done').length;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-foreground mb-2">ようこそ、{profile.name}さん</h1>
        <p className="text-muted-foreground text-sm">今日の冒険を選んでください。</p>
      </section>

      {!questsLoading && (
        <section className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">クエスト状況</h2>
          <p className="text-card-foreground">
            未完了 <span className="font-bold text-primary">{todoCount}</span> 件 / 完了{' '}
            <span className="font-bold text-accent">{doneCount}</span> 件
          </p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">メニュー</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {links.map(({ to, label, icon: Icon, description }) => (
            <Link
              key={to}
              to={to}
              className="flex items-start gap-4 p-4 rounded-xl bg-card/80 border border-border hover:border-primary/60 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-card-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
