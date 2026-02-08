import React from 'react';
import { CharacterProfile } from '@skill-quest/shared';
import StatsChart from './RadarChart';
import { User, Heart, Star, Coins, ScrollText } from 'lucide-react';

interface StatusPanelProps {
  profile: CharacterProfile;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ profile }) => {
  const xpPercentage = Math.min((profile.currentXp / profile.nextLevelXp) * 100, 100);

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 h-full flex flex-col shadow-xl overflow-y-auto">
      {/* Avatar & Basic Info */}
      <div className="text-center mb-6">
        <div 
          className="w-24 h-24 mx-auto bg-slate-700 rounded-full mb-4 flex items-center justify-center border-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          style={{ borderColor: profile.themeColor }}
        >
          <User className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{profile.name}</h2>
        <p className="text-sm text-indigo-400 font-medium mb-1">{profile.className}</p>
        <p className="text-xs text-slate-500 italic">"{profile.title}"</p>
      </div>

      {/* Bars */}
      <div className="space-y-4 mb-8">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center text-red-400"><Heart className="w-3 h-3 mr-1 fill-current" /> HP</span>
            <span className="text-slate-400">{profile.hp} / {profile.maxHp}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${(profile.hp / profile.maxHp) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center text-yellow-400"><Star className="w-3 h-3 mr-1 fill-current" /> XP (Lv.{profile.level})</span>
            <span className="text-slate-400">{profile.currentXp} / {profile.nextLevelXp}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-end text-sm text-yellow-200 font-bold bg-slate-900/40 p-2 rounded-lg border border-yellow-500/20">
           <Coins className="w-4 h-4 mr-2 text-yellow-500" />
           {profile.gold} G
        </div>
      </div>

      {/* Stats */}
      <div className="flex-grow">
        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase flex items-center">
           <ScrollText className="w-4 h-4 mr-1" /> 能力値
        </h3>
        <div className="-ml-4 -mr-4">
          <StatsChart stats={profile.stats} color={profile.themeColor} />
        </div>
      </div>
      
      {/* Skill */}
      <div className="mt-4 pt-4 border-t border-slate-700">
         <h4 className="text-xs text-slate-500 uppercase mb-1">パッシブスキル</h4>
         <p className="text-sm text-white font-medium">{profile.startingSkill}</p>
      </div>
    </div>
  );
};

export default StatusPanel;
