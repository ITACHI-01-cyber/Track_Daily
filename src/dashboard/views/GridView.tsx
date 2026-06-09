import React from 'react';
import { format, addDays, isToday, startOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';

export const GridView = () => {
  const { habits, selectedDate, setSelectedDate, toggleHabit } = useAppContext();
  
  const start = startOfWeek(selectedDate);
  const end = addDays(start, 6);
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Weekly Habit Matrix</h2>
        <div className="flex gap-2 self-start sm:self-auto">
          <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 hover:bg-panel-bg rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-panel-bg rounded-md transition-colors">
            This Week
          </button>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-panel-bg rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="bg-card-surface rounded-2xl shadow-sm border border-border-strong overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-page-bg">
              <th className="p-3 text-left text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border-strong">
                Habit
              </th>
              {days.map((day) => (
                <th key={day.toString()} className="p-3 text-center border-b border-border-strong min-w-[48px]">
                  <p className="text-[10px] font-bold text-text-muted uppercase">{format(day, 'EEE')}</p>
                  <p className={cn('text-sm font-bold', isToday(day) ? 'text-indigo-600' : 'text-gray-700')}>
                    {format(day, 'd')}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit: any) => (
              <tr key={habit.id} className="hover:bg-page-bg transition-colors">
                <td className="p-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', habit.type === 'positive' ? 'bg-emerald-500' : 'bg-red-500')}></div>
                    <span className="font-semibold text-gray-700 text-sm">{habit.name}</span>
                  </div>
                </td>
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const status = habit.history[dateStr] || 'none';
                  return (
                    <td key={dateStr} className="p-3 border-b border-l border-gray-50 text-center">
                      <button
                        onClick={() => toggleHabit(habit.id, dateStr)}
                        className={cn(
                          'w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all mx-auto min-h-[44px] min-w-[44px]',
                          status === 'done'
                            ? habit.type === 'positive'
                              ? 'bg-emerald-500 border-transparent'
                              : 'bg-red-500 border-transparent'
                            : status === 'failed'
                            ? 'bg-gray-800 border-transparent'
                            : 'border-border-strong hover:border-gray-300'
                        )}
                      >
                        {status === 'done' && <Check size={16} className="text-white" />}
                        {status === 'failed' && <X size={16} className="text-white" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {habits.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-text-muted italic">
                  No habits tracked. Add some in the Habits tab!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
