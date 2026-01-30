import React, { useState } from 'react';
import { Task, TaskType, Difficulty } from '../types';
import { Plus, Trash2, CheckSquare, Repeat, Calendar, Check } from 'lucide-react';

interface QuestBoardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'streak'>) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const QuestBoard: React.FC<QuestBoardProps> = ({ tasks, onAddTask, onCompleteTask, onDeleteTask }) => {
  const [activeTab, setActiveTab] = useState<TaskType>(TaskType.DAILY);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<Difficulty>(Difficulty.EASY);

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({
      title: newTaskTitle,
      type: activeTab,
      difficulty: newTaskDifficulty,
    });
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter(t => t.type === activeTab);

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return 'text-green-400 border-green-400/30 bg-green-400/10';
      case Difficulty.MEDIUM: return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case Difficulty.HARD: return 'text-red-400 border-red-400/30 bg-red-400/10';
    }
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
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
        {[TaskType.DAILY, TaskType.HABIT, TaskType.TODO].map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === type
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {type === TaskType.DAILY && 'デイリー'}
            {type === TaskType.HABIT && '習慣'}
            {type === TaskType.TODO && 'To-Do'}
          </button>
        ))}
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

      {/* Task List */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-slate-500 py-10 italic">
            クエストがありません
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`group relative p-4 rounded-lg border transition-all duration-300 ${
                task.completed 
                  ? 'bg-slate-800/30 border-slate-700/50 opacity-60' 
                  : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => !task.completed && onCompleteTask(task.id)}
                    disabled={task.completed}
                    className={`mt-1 w-6 h-6 rounded border flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-slate-500 text-transparent hover:border-indigo-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getDifficultyColor(task.difficulty)}`}>
                        {task.difficulty}
                      </span>
                      {task.type !== TaskType.TODO && (
                        <span className="text-xs text-slate-500 flex items-center">
                          <Repeat className="w-3 h-3 mr-1" /> Streak: {task.streak || 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestBoard;