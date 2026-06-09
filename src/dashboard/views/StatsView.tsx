import React from 'react';
import { format, addDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Trophy } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';
import { BADGES } from '../../constants';

export const StatsView = () => {
  const { habits, unlockedBadges } = useAppContext();
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), -i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const completedCount = habits.reduce(
      (acc: number, h: any) => acc + (h.history[dateStr] ? (h.type === 'positive' ? 1 : -1) : 0),
      0
    );
    return { name: format(date, 'EEE'), score: completedCount, date: dateStr };
  }).reverse();

  return (
    <div className="space-y-6 pb-6">
      <h2 className="text-2xl font-bold text-gray-800">Analytics & Progress</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Score Chart */}
        <div className="bg-card-surface p-5 rounded-2xl shadow-sm border border-border-strong">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-indigo-500" size={18} /> Habit Performance Score
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-text-muted italic">Score = (Positive Done) - (Negative Done)</p>
        </div>

        {/* Badges */}
        <div className="bg-card-surface p-5 rounded-2xl shadow-sm border border-border-strong">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={18} /> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all flex flex-col items-center text-center',
                    isUnlocked ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-page-bg border-border-strong opacity-50 grayscale'
                  )}
                >
                  <span className="text-3xl mb-2">{badge.icon}</span>
                  <p className="font-bold text-sm text-gray-800">{badge.name}</p>
                  <p className="text-[10px] text-text-muted mt-1 leading-tight">{badge.description}</p>
                  {isUnlocked && (
                    <span className="mt-2 text-[8px] font-bold uppercase text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                      Unlocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
