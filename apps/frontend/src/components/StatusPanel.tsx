import React from 'react';
import { CharacterProfile, WORLDVIEWS } from '@skill-quest/shared';
import { User, Star, Coins, Sparkles } from 'lucide-react';

interface StatusPanelProps {
  profile: CharacterProfile;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ profile }) => {
  const xpPercentage = Math.min((profile.currentXp / profile.nextLevelXp) * 100, 100);

  const worldview = WORLDVIEWS.find((w) => w.id === profile.worldviewId) ?? WORLDVIEWS[0];

  return (
    <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 h-full flex flex-col shadow-xl overflow-y-auto">
      {/* Avatar & Basic Info */}
      <div className="text-center mb-6">
        <div 
          className="w-24 h-24 mx-auto bg-background rounded-full mb-4 flex items-center justify-center border-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          style={{ borderColor: 'var(--primary)' }}
        >
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
        <p className="text-sm text-primary font-medium mb-1">{profile.className}</p>
        <p className="text-xs text-muted-foreground italic">"{profile.title}"</p>
        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background/80 border border-border text-[10px] font-medium text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="truncate max-w-40">
            {worldview.label}
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-4 mb-8">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center" style={{ color: 'var(--reward-fg)' }}><Star className="w-3 h-3 mr-1 fill-current" /> XP (Lv.{profile.level})</span>
            <span className="text-muted-foreground">{profile.currentXp} / {profile.nextLevelXp}</span>
          </div>
          <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${xpPercentage}%`, backgroundColor: 'var(--reward-fg)' }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end text-sm font-bold bg-background/60 p-2 rounded-lg border border-border" style={{ color: 'var(--reward-fg)' }}>
           <Coins className="w-4 h-4 mr-2" />
           {profile.gold} G
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
