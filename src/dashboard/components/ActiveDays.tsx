import { eachDayOfInterval, endOfMonth, format, getDay, isToday, startOfMonth } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Habit, Task } from '../../types';
import { cn } from '../../utils';

interface ActiveDaysProps {
  tasks: Task[];
  habits: Habit[];
  onSelectDate: (date: Date) => void;
}

const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function ActiveDays({ tasks, habits, onSelectDate }: ActiveDaysProps) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingCells = (getDay(monthStart) + 6) % 7;

  const getIntensity = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const completedTasks = tasks.filter(task => task.date === key && task.completed).length;
    const completedHabits = habits.filter(habit => habit.history[key] === 'done').length;
    return completedTasks + completedHabits;
  };

  return (
    <div className="bg-card-surface border border-border-strong rounded-[32px] p-8 text-text-main h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-display font-semibold">Your Active Days</h2>
        <button className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors">
          {format(new Date(), 'MMMM')} <ChevronDown size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-[10px] font-bold tracking-tighter opacity-80 mb-4">
        {daysShort.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: leadingCells }).map((_, index) => (
          <div key={`empty-${index}`} className="w-8 h-8" />
        ))}
        {days.map(day => {
          const intensity = getIntensity(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors",
                intensity > 0 ? "bg-cta-btn text-white font-bold" : "bg-page-bg hover:bg-panel-bg text-text-muted",
                intensity > 2 && "shadow-lg shadow-black/20 ring-2 ring-black/10",
                isToday(day) && "outline outline-2 outline-cta-btn"
              )}
              title={`${intensity} completions`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
