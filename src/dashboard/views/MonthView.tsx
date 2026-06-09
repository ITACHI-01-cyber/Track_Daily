import React from 'react';
import { format, addMonths, subMonths, isToday, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';

export const MonthView = () => {
  const { tasks, habits, selectedDate, setSelectedDate, setActiveTab } = useAppContext();
  
  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);
  const monthStart = startOfWeek(start);
  const monthEnd = endOfWeek(end);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-4 pb-6">
      {/* iOS-style month header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
          className="p-2 hover:bg-panel-bg rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-muted" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black text-text-main tracking-tight">{format(selectedDate, 'MMMM')}</h2>
          <p className="text-xs text-text-muted font-semibold">{format(selectedDate, 'yyyy')}</p>
        </div>
        <button
          onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
          className="p-2 hover:bg-panel-bg rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight size={20} className="text-text-muted" />
        </button>
      </div>

      {/* Today button */}
      <div className="flex justify-center">
        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-4 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Compact responsive calendar */}
      <div className="bg-card-surface rounded-2xl shadow-sm border border-border-strong overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-border-strong">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="py-2 text-center text-[10px] font-black text-text-muted uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const ds = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter((t: any) => t.date === ds);
            const dayHabitsDone = habits.filter((h: any) => h.history[ds] === 'done').length;
            const allHabitsDone = habits.length > 0 && dayHabitsDone === habits.length;
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toString()}
                className={cn(
                  'flex flex-col items-center justify-start py-1.5 min-h-[48px] border-b border-r border-gray-50 cursor-pointer transition-colors',
                  !isCurrentMonth && 'opacity-25',
                  allHabitsDone && isCurrentMonth ? 'bg-emerald-50' : '',
                  isTodayDay ? 'bg-indigo-50' : !allHabitsDone ? 'hover:bg-page-bg' : 'hover:bg-emerald-100'
                )}
                onClick={() => { setSelectedDate(day); setActiveTab('day'); }}
              >
                <span
                  className={cn(
                    'w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full transition-all',
                    isTodayDay
                      ? 'bg-indigo-600 text-white'
                      : isSelected
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {dayTasks.length > 0 && (
                    <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                  )}
                  {dayHabitsDone > 0 && (
                    <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span className="text-[10px] text-text-muted font-medium">Tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-[10px] text-text-muted font-medium">Habits done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200"></span>
          <span className="text-[10px] text-text-muted font-medium">All habits done</span>
        </div>
      </div>
    </div>
  );
};
