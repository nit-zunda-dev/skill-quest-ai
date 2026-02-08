import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { CharacterStats } from '@skill-quest/shared';

interface StatsChartProps {
  stats: CharacterStats;
  color: string;
}

const StatsChart: React.FC<StatsChartProps> = ({ stats, color }) => {
  const data = [
    { subject: '筋力', A: stats.strength, fullMark: 100 },
    { subject: '知力', A: stats.intelligence, fullMark: 100 },
    { subject: '魅力', A: stats.charisma, fullMark: 100 },
    { subject: '意志', A: stats.willpower, fullMark: 100 },
    { subject: '幸運', A: stats.luck, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Stats"
            dataKey="A"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
