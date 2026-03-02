import React, { useState, useMemo } from 'react';
import { Task, TaskType, Difficulty } from '@skill-quest/shared';
import { Plus, Trash2, Repeat, Check, Sparkles, Sword, Hourglass, Trophy, Shield, Flame } from 'lucide-react';

type StatusKey = 'todo' | 'in_progress' | 'done';

interface QuestBoardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'streak'>) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus?: (taskId: string, status: StatusKey) => void;
  /** クエスト0件時に「目標からクエストを生成」案内を表示する場合に渡す。CTAクリックで呼ばれる。 */
  onRequestSuggestFromGoal?: () => void;
}

const QuestBoard: React.FC<QuestBoardProps> = ({ tasks, onAddTask, onCompleteTask, onDeleteTask, onUpdateStatus, onRequestSuggestFromGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [activeMobileTab, setActiveMobileTab] = useState<StatusKey>('todo');

  // タスクをステータスごとに分類
  const tasksByStatus = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const done: Task[] = [];
    
    tasks.forEach(task => {
      const status = task.status || (task.completed ? 'done' : 'todo');
      if (status === 'done') {
        done.push(task);
      } else if (status === 'in_progress') {
        inProgress.push(task);
      } else {
        todo.push(task);
      }
    });
    
    return { todo, inProgress, done };
  }, [tasks]);

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({
      title: newTaskTitle,
      type: TaskType.TODO, // デフォルトでTODOとして追加
      difficulty: newTaskDifficulty,
    });
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return 'text-emerald-400 border-emerald-600/50 bg-emerald-900/30';
      case Difficulty.MEDIUM: return 'text-amber-300 border-amber-500/50 bg-amber-900/30';
      case Difficulty.HARD: return 'text-rose-400 border-rose-600/50 bg-rose-900/30';
    }
  };

  const statusConfig: Record<StatusKey, { label: string; icon: React.ReactNode; headerClass: string }> = {
    todo: { label: '未着手クエスト', icon: <Sword className="w-4 h-4" />, headerClass: 'bg-slate-700/70 border-slate-500/50 text-slate-200' },
    in_progress: { label: '進行中クエスト', icon: <Hourglass className="w-4 h-4" />, headerClass: 'bg-amber-900/40 border-amber-500/50 text-amber-200' },
    done: { label: '達成クエスト', icon: <Trophy className="w-4 h-4" />, headerClass: 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200' },
  };

  const getStatusPill = (status: StatusKey) => {
    const { label, icon } = statusConfig[status];
    const pillClass =
      status === 'done'
        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
        : status === 'in_progress'
          ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
          : 'bg-slate-500/20 border-slate-500/60 text-slate-300';
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${pillClass}`}>
        {icon}
        {label}
      </span>
    );
  };

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    if (onUpdateStatus) {
      onUpdateStatus(taskId, newStatus);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (!onUpdateStatus) return;
    const status = task.status || (task.completed ? 'done' : 'todo');
    if (status === 'todo') {
      handleStatusChange(task.id, 'in_progress');
    } else if (status === 'in_progress') {
      handleStatusChange(task.id, 'done');
    } else {
      handleStatusChange(task.id, 'todo');
    }
  };

  const renderTaskCard = (task: Task) => {
    const status: StatusKey = task.status || (task.completed ? 'done' : 'todo');
    return (
      <div 
        key={task.id} 
        onClick={() => handleTaskClick(task)}
        className="group relative p-3 rounded-lg border-2 bg-linear-to-br from-amber-50/10 via-slate-800/95 to-amber-100/10 border-amber-700/30 hover:border-amber-500/50 hover:from-amber-50/15 hover:to-amber-100/15 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <div
              className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
                status === 'done'
                  ? 'bg-green-500/20 border-green-500 text-green-500'
                  : status === 'in_progress'
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                  : 'border-slate-500 text-transparent'
              }`}
            >
              {status === 'done' && <Check className="w-3 h-3" />}
              {status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1.5">{getStatusPill(status)}</div>
              <h3 className={`font-medium text-sm ${status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {task.title}
              </h3>
              <div className="flex items-center mt-1 space-x-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyColor(task.difficulty)}`}>
                  {task.difficulty}
                </span>
                {task.type !== TaskType.TODO && (
                  <span className="text-xs text-amber-400/90 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" aria-hidden />
                    <span>連続 {task.streak || 0}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-400 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 -m-2"
            aria-label="クエストを削除"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-linear-to-br from-amber-950/25 via-slate-800/60 to-amber-950/20 backdrop-blur-md border-2 border-amber-800/40 rounded-xl p-6 h-full flex flex-col shadow-xl shadow-amber-950/20">
      <header className={tasks.length === 0 ? 'mb-6' : ''}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-amber-50 flex items-center tracking-wide">
            <Shield className="w-6 h-6 mr-2 text-amber-400/90" aria-hidden />
            <span>クエストボード</span>
          </h2>
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors"
            aria-label="クエストを追加"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {tasks.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
            <span>全クエスト: {tasks.length}</span>
            <span>完了: {tasksByStatus.done.length}</span>
          </div>
        )}
        {tasks.length > 0 && onUpdateStatus && (
          <p className="mb-4 text-xs text-slate-400">
            カードをタップすると 未着手 → 進行中 → 達成 の順に切り替わります
          </p>
        )}
      </header>

      {/* Add Task Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-slate-900/80 rounded-lg border border-indigo-500/50 animate-fade-in-up">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="クエスト名を入力..."
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            aria-label="クエスト名"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              } else if (e.key === 'Escape') {
                setIsAdding(false);
              }
            }}
          />
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {Object.values(Difficulty).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setNewTaskDifficulty(d)}
                  className={`min-h-[44px] px-3 py-2 rounded text-xs font-bold border ${
                    newTaskDifficulty === d ? getDifficultyColor(d) : 'border-slate-700 text-slate-400'
                  }`}
                  aria-pressed={newTaskDifficulty === d}
                  aria-label={`難易度: ${d}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <button type="button" onClick={() => setIsAdding(false)} className="min-h-[44px] text-slate-400 hover:text-white px-4 py-2 text-sm">キャンセル</button>
              <button type="button" onClick={handleAdd} className="min-h-[44px] bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-500">追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 空状態: クエスト0件かつ目標から提案を促す場合（Task 8.1） */}
      {tasks.length === 0 && onRequestSuggestFromGoal ? (
        <div className="grow flex flex-col items-center justify-center py-12 px-4 text-center min-h-0">
          <p className="text-slate-300 text-sm mb-4">
            目標に沿ったクエストをAIが提案します。まずは提案を取得してみましょう。
          </p>
          <button
            type="button"
            onClick={onRequestSuggestFromGoal}
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
            aria-label="目標からクエストを生成"
          >
            <Sparkles className="w-5 h-5" />
            目標からクエストを生成する
          </button>
        </div>
      ) : (
        <>
          {/* モバイル: ステータスタブ（md以上では非表示） */}
          <div className="md:hidden flex gap-1 mb-3 shrink-0" role="tablist" aria-label="クエストの状態">
            {(
              [
                { key: 'todo' as const, label: '未着手' },
                { key: 'in_progress' as const, label: '進行中' },
                { key: 'done' as const, label: '達成' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeMobileTab === key}
                aria-controls={`quest-panel-${key}`}
                id={`quest-tab-${key}`}
                onClick={() => setActiveMobileTab(key)}
                className={`min-h-[44px] flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeMobileTab === key
                    ? key === 'todo'
                      ? 'bg-slate-600 text-white shadow'
                      : key === 'in_progress'
                        ? 'bg-amber-600/90 text-white shadow'
                        : 'bg-emerald-600/90 text-white shadow'
                    : 'bg-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label} ({key === 'todo' ? tasksByStatus.todo.length : key === 'in_progress' ? tasksByStatus.inProgress.length : tasksByStatus.done.length})
              </button>
            ))}
          </div>

          {/* モバイル: 1カラム（選択中タブのクエストのみ表示） */}
          <div
            id="quest-panel-todo"
            role="tabpanel"
            aria-labelledby="quest-tab-todo"
            className={`md:hidden flex flex-col flex-1 min-h-0 ${activeMobileTab !== 'todo' ? 'hidden' : ''}`}
          >
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasksByStatus.todo.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">クエストなし</div>
              ) : (
                tasksByStatus.todo.map(renderTaskCard)
              )}
            </div>
          </div>
          <div
            id="quest-panel-in_progress"
            role="tabpanel"
            aria-labelledby="quest-tab-in_progress"
            className={`md:hidden flex flex-col flex-1 min-h-0 ${activeMobileTab !== 'in_progress' ? 'hidden' : ''}`}
          >
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasksByStatus.inProgress.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">クエストなし</div>
              ) : (
                tasksByStatus.inProgress.map(renderTaskCard)
              )}
            </div>
          </div>
          <div
            id="quest-panel-done"
            role="tabpanel"
            aria-labelledby="quest-tab-done"
            className={`md:hidden flex flex-col flex-1 min-h-0 ${activeMobileTab !== 'done' ? 'hidden' : ''}`}
          >
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasksByStatus.done.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">クエストなし</div>
              ) : (
                tasksByStatus.done.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* デスクトップ: 3カラムカンバン（md以上で表示） */}
          <div className="hidden md:grid grow grid-cols-3 gap-4 min-h-0">
            {(['todo', 'in_progress', 'done'] as const).map((key) => {
              const config = statusConfig[key];
              const list = key === 'todo' ? tasksByStatus.todo : key === 'in_progress' ? tasksByStatus.inProgress : tasksByStatus.done;
              return (
                <div key={key} className="flex flex-col min-h-0">
                  <div className={`mb-3 px-3 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold ${config.headerClass}`}>
                    {config.icon}
                    <span>{config.label}</span>
                    <span className="opacity-90">({list.length})</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {list.length === 0 ? (
                      <div className="text-center text-slate-500 py-8 text-sm">クエストなし</div>
                    ) : (
                      list.map(renderTaskCard)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestBoard;
