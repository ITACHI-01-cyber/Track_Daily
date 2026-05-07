import { CheckCircle2, Clock3, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { type ReactNode } from 'react';
import { Habit, Task } from '../../types';

interface FocusCardProps {
  tasks: Task[];
  habits: Habit[];
}

export function FocusCard({ tasks, habits }: FocusCardProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysTasks = tasks.filter(task => task.date === today);
  const completedTasks = todaysTasks.filter(task => task.completed).length;
  const completedHabits = habits.filter(habit => habit.history[today] === 'done').length;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(habit => habit.streak)) : 0;
  const totalToday = todaysTasks.length + habits.length;
  const completedToday = completedTasks + completedHabits;
  const percentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card-bg border border-card-border rounded-[32px] p-8 flex items-center justify-between overflow-hidden relative h-full">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-display font-semibold text-white">Today Focus</h3>
          <p className="text-gray-400 text-xs">Live progress from MongoDB synced data</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric icon={<CheckCircle2 size={16} />} label="Done" value={`${completedToday}/${totalToday}`} />
          <Metric icon={<Flame size={16} />} label="Best streak" value={`${longestStreak}d`} />
          <Metric icon={<Clock3 size={16} />} label="Tasks" value={`${completedTasks}/${todaysTasks.length}`} />
          <Metric icon={<CheckCircle2 size={16} />} label="Habits" value={`${completedHabits}/${habits.length}`} />
        </div>
      </div>

      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-brand-lime transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-display text-white">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 border border-card-border/60 p-3">
      <div className="flex items-center gap-2 text-brand-lime">{icon}<span className="text-[10px] uppercase font-bold text-gray-500">{label}</span></div>
      <div className="text-white font-display font-bold mt-1">{value}</div>
    </div>
  );
}
