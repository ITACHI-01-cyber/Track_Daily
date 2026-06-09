import React, { useState } from 'react';
import { format, addDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';
import { priorityBorderColor } from '../../constants';

export const WeekView = () => {
  const { 
    tasks, selectedDate, setSelectedDate, setActiveTab, 
    setModalType, setIsModalOpen, toggleTask, theme 
  } = useAppContext();
  
  const start = startOfWeek(selectedDate);
  const end = endOfWeek(selectedDate);
  const days = eachDayOfInterval({ start, end });
  const [weekSelectedDay, setWeekSelectedDay] = useState(selectedDate);
  const selectedDayTasks = tasks.filter((t: any) => t.date === format(weekSelectedDay, 'yyyy-MM-dd'));

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-text-main tracking-tight">Week of {format(start, 'MMM d')}</h2>
        <div className="flex items-center gap-1 bg-panel-bg rounded-2xl p-1">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="p-2 hover:bg-card-surface rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-text-muted" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 text-xs font-bold bg-card-surface rounded-xl shadow-sm text-gray-700 min-h-[44px]"
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="p-2 hover:bg-card-surface rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      {/* Horizontal scrollable week strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {days.map((day) => {
          const dayTaskCount = tasks.filter((t: any) => t.date === format(day, 'yyyy-MM-dd')).length;
          const isSelected = isSameDay(day, weekSelectedDay);
          const isTodayDay = isToday(day);
          return (
            <button
              key={day.toString()}
              onClick={() => { setWeekSelectedDay(day); setSelectedDate(day); setActiveTab('day'); }}
              className={cn(
                'flex flex-col items-center min-w-[64px] py-3 px-2 rounded-2xl transition-all shrink-0 gap-1',
                isSelected
                  ? cn(theme.primary, 'text-white shadow-lg')
                  : isTodayDay
                  ? 'bg-panel-bg text-gray-800 border-2 border-gray-300'
                  : 'bg-card-surface border border-border-strong text-text-muted hover:border-gray-300'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{format(day, 'EEE')}</span>
              <span className="text-2xl font-black leading-tight">{format(day, 'd')}</span>
              {dayTaskCount > 0 ? (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    isSelected ? 'bg-card-surface/30 text-white' : 'bg-indigo-100 text-indigo-600'
                  )}
                >
                  {dayTaskCount}
                </span>
              ) : (
                <span className="text-[10px] text-transparent">·</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      <div className="bg-card-surface rounded-2xl shadow-sm border border-border-strong overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">{format(weekSelectedDay, 'EEEE, MMMM d')}</h3>
          <button
            onClick={() => { setSelectedDate(weekSelectedDay); setModalType('task'); setIsModalOpen(true); }}
            className={cn('p-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center', theme.primary)}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="p-3 space-y-2">
          {selectedDayTasks.length === 0 ? (
            <p className="text-text-muted text-center py-10 text-sm italic">No tasks — add one!</p>
          ) : (
            selectedDayTasks.map((task: any) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border-l-4 transition-all',
                  task.completed
                    ? 'bg-page-bg border-l-gray-200'
                    : cn('bg-card-surface border border-border-strong shadow-sm', priorityBorderColor[task.priority])
                )}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 min-h-[44px] min-w-[44px]',
                    task.completed ? cn(theme.primary, 'border-transparent') : 'border-gray-300'
                  )}
                >
                  {task.completed && <Check size={12} className="text-white" />}
                </button>
                <span className={cn('flex-1 text-sm font-semibold', task.completed && 'line-through text-text-muted')}>
                  {task.title}
                </span>
                {task.startTime && <span className="text-[10px] text-text-muted">{task.startTime}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
