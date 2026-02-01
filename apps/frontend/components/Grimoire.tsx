import React from 'react';
import { GrimoireEntry } from '@skill-quest/shared';
import { Scroll, Sparkles } from 'lucide-react';

interface GrimoireProps {
  entries: GrimoireEntry[];
}

const Grimoire: React.FC<GrimoireProps> = ({ entries }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 h-full flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Scroll className="w-5 h-5 mr-2 text-indigo-400" />
          グリモワール (冒険の記録)
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-center text-slate-500 py-10 italic">
            まだ物語は始まっていません
          </div>
        ) : (
          entries.slice().reverse().map(entry => (
            <div key={entry.id} className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
                <span className="text-xs text-indigo-300 border border-indigo-900 bg-indigo-900/20 px-2 py-0.5 rounded">
                  {entry.taskTitle}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {entry.narrative}
              </p>
              <div className="flex items-center text-xs space-x-3 text-yellow-500/80 font-medium">
                 <span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> +{entry.rewardXp} XP</span>
                 <span className="flex items-center">+{entry.rewardGold} G</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Grimoire;