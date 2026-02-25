import React, { useState, useMemo } from 'react';
import { Task, TaskType, Difficulty } from '@skill-quest/shared';
import { Plus, Trash2, Repeat, Check, Sparkles } from 'lucide-react';

interface QuestBoardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'streak'>) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus?: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
  /** クエスト0件時に「目標からタスクを生成」案内を表示する場合に渡す。CTAクリックで呼ばれる。 */
  onRequestSuggestFromGoal?: () => void;
}

const QuestBoard: React.FC<QuestBoardProps> = ({ tasks, onAddTask, onCompleteTask, onDeleteTask, onUpdateStatus, onRequestSuggestFromGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<Difficulty>(Difficulty.EASY);

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
      case Difficulty.EASY: return 'text-green-400 border-green-400/30 bg-green-400/10';
      case Difficulty.MEDIUM: return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case Difficulty.HARD: return 'text-red-400 border-red-400/30 bg-red-400/10';
    }
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
      onCompleteTask(task.id);
    } else {
      handleStatusChange(task.id, 'todo');
    }
  };

  const renderTaskCard = (task: Task) => {
    const status = task.status || (task.completed ? 'done' : 'todo');
    return (
      <div 
        key={task.id} 
        onClick={() => handleTaskClick(task)}
        className="group relative p-3 rounded-lg border bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <div
              className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
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
              <h3 className={`font-medium text-sm ${status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {task.title}
              </h3>
              <div className="flex items-center mt-1 space-x-2 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getDifficultyColor(task.difficulty)}`}>
                  {task.difficulty}
                </span>
                {task.type !== TaskType.TODO && (
                  <span className="text-xs text-slate-500 flex items-center">
                    <Repeat className="w-3 h-3 mr-1" /> {task.streak || 0}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 h-full flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">クエストボード</span>
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors"
          aria-label="タスクを追加"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-slate-900/80 rounded-lg border border-indigo-500/50 animate-fade-in-up">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="タスク名を入力..."
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  onClick={() => setNewTaskDifficulty(d)}
                  className={`px-3 py-1 rounded text-xs font-bold border ${
                    newTaskDifficulty === d ? getDifficultyColor(d) : 'border-slate-700 text-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white px-3 py-1 text-sm">キャンセル</button>
              <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-500">追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 空状態: クエスト0件かつ目標から提案を促す場合（Task 8.1） */}
      {tasks.length === 0 && onRequestSuggestFromGoal ? (
        <div className="flex-grow flex flex-col items-center justify-center py-12 px-4 text-center min-h-0">
          <p className="text-slate-400 text-sm mb-4">
            目標に沿ったタスクをAIが提案します。まずは提案を取得してみましょう。
          </p>
          <button
            type="button"
            onClick={onRequestSuggestFromGoal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
            aria-label="目標からタスクを生成"
          >
            <Sparkles className="w-5 h-5" />
            目標からタスクを生成する
          </button>
        </div>
      ) : (
        /* Kanban Board */
        <div className="flex-grow grid grid-cols-3 gap-4 min-h-0">
          {/* To Do Column */}
          <div className="flex flex-col min-h-0">
            <div className="mb-3 px-2 py-1 bg-slate-700/50 rounded text-sm font-semibold text-slate-300 text-center">
              To Do ({tasksByStatus.todo.length})
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasksByStatus.todo.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-xs italic">
                  タスクなし
                </div>
              ) : (
                tasksByStatus.todo.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="flex flex-col min-h-0">
            <div className="mb-3 px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded text-sm font-semibold text-yellow-300 text-center">
              In Progress ({tasksByStatus.inProgress.length})
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasksByStatus.inProgress.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-xs italic">
                  タスクなし
                </div>
              ) : (
                tasksByStatus.inProgress.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="flex flex-col min-h-0">
            <div className="mb-3 px-2 py-1 bg-green-900/30 border border-green-500/30 rounded text-sm font-semibold text-green-300 text-center">
              Done ({tasksByStatus.done.length})
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasksByStatus.done.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-xs italic">
                  タスクなし
                </div>
              ) : (
                tasksByStatus.done.map(renderTaskCard)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestBoard;
