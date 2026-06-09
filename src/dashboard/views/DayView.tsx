import React, { useEffect, useRef } from 'react';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Plus, Check, Pencil, Trash2, Flame, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';
import { priorityBorderColor, priorityBadgeColor } from '../../constants';

export const DayView = () => {
    const { 
      tasks, habits, selectedDate, setSelectedDate, getDayStreakColor, maxStreak, 
      toggleTask, toggleHabit, setEditingItem, setModalType, setIsModalOpen, 
      deleteTask, deleteHabit, theme 
    } = useAppContext();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const dayHabits = habits;
    const streakScrollRef = useRef<HTMLDivElement>(null);

    // 14-day streak strip — always centered around selectedDate
    // Shows 7 days before selectedDate, selectedDate itself, and 6 days after (capped at today)
    const today = new Date();
    const streakDays = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(selectedDate, -(6) + i); // 6 days before → selectedDate → 7 days after
      const ds = format(d, 'yyyy-MM-dd');
      const isFuture = d > today;
      return { d, ds, isToday: isToday(d), isFuture, dayNum: format(d, 'd'), dayName: format(d, 'EEE') };
    });

    // Auto-scroll to keep selected day in view (index 6 = selectedDate)
    useEffect(() => {
      if (streakScrollRef.current) {
        const container = streakScrollRef.current;
        const selectedEl = container.children[6] as HTMLElement;
        if (selectedEl) {
          selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }, [selectedDate]);

    return (
      <div className="space-y-4 pb-6">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-text-main tracking-tight">{format(selectedDate, 'EEEE')}</h2>
            <p className="text-xs text-text-muted font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-1 bg-panel-bg rounded-2xl p-1">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-2 hover:bg-card-surface rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-text-muted" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold bg-card-surface rounded-xl shadow-sm text-gray-700 hover:shadow transition-all min-h-[44px]"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-card-surface rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-text-muted" />
            </button>
          </div>
        </div>

        {/* 14-day streak strip */}
        <div className="bg-card-surface rounded-2xl shadow-sm border border-border-strong p-3">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Last 14 Days</p>
          <div ref={streakScrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {streakDays.map((item, i) => {
              const color = getDayStreakColor(item.ds);
              const isSelected = item.ds === dateStr;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(item.d)}
                  className="flex flex-col items-center gap-0.5 shrink-0"
                >
                  <span className="text-[9px] text-text-muted font-medium">{item.dayName}</span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      item.isFuture ? 'bg-panel-bg text-gray-300' : color,
                      item.isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : '',
                      isSelected ? 'ring-2 ring-indigo-600 ring-offset-1' : '',
                      item.isFuture ? '' : color === 'bg-gray-200' ? 'text-text-muted' : 'text-white'
                    )}
                  >
                    {item.dayNum}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flame streak card */}
        {maxStreak > 0 && (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div>
              <p className="text-4xl font-black leading-none">{maxStreak}</p>
              <p className="text-sm font-semibold opacity-90">day streak</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs opacity-80 font-medium">Keep it going!</p>
              <p className="text-xs opacity-70">{habits.filter((h) => h.history[dateStr] === 'done').length}/{habits.length} habits today</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks Section */}
          <section className="bg-card-surface rounded-2xl shadow-sm border border-border-strong overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 size={16} className={theme.accent} />
                Tasks
                <span className="text-[10px] font-bold text-text-muted bg-panel-bg px-1.5 py-0.5 rounded-full">
                  {dayTasks.length}
                </span>
              </h3>
              <button
                onClick={() => { setModalType('task'); setIsModalOpen(true); }}
                className={cn('p-1.5 rounded-xl text-white flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center', theme.primary)}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {dayTasks.length === 0 ? (
                <p className="text-text-muted text-center py-10 text-sm italic">No tasks for today</p>
              ) : (
                dayTasks.map((task) => (
                  <motion.div
                    layout
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
                        'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 min-h-[44px] min-w-[44px]',
                        task.completed ? cn(theme.primary, 'border-transparent') : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {task.completed && <Check size={14} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-semibold text-sm truncate', task.completed && 'line-through text-text-muted')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.startTime && (
                          <span className="text-[10px] text-text-muted font-medium">
                            {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
                          </span>
                        )}
                        {task.priority && (
                          <span className={cn('text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full', priorityBadgeColor[task.priority])}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Always-visible action buttons on mobile */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingItem(task); setModalType('task'); setIsModalOpen(true); }}
                        className="p-2 text-text-muted hover:text-indigo-500 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Habits Section */}
          <section className="bg-card-surface rounded-2xl shadow-sm border border-border-strong overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                Habits
                <span className="text-[10px] font-bold text-text-muted bg-panel-bg px-1.5 py-0.5 rounded-full">
                  {dayHabits.length}
                </span>
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {dayHabits.length === 0 ? (
                <p className="text-text-muted text-center py-10 text-sm italic">No habits tracked yet</p>
              ) : (
                dayHabits.map((habit) => {
                  const status = habit.history[dateStr] || 'none';
                  const last7 = Array.from({ length: 7 }, (_, i) => {
                    const d = addDays(new Date(), -(6 - i));
                    const ds = format(d, 'yyyy-MM-dd');
                    return { ds, status: habit.history[ds] || 'none', isToday: isSameDay(d, new Date()) };
                  });
                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl border transition-all',
                        status === 'done'
                          ? 'bg-emerald-50 border-emerald-100'
                          : status === 'failed'
                          ? 'bg-red-50 border-red-100'
                          : 'bg-card-surface border-border-strong shadow-sm'
                      )}
                    >
                      <button
                        onClick={() => toggleHabit(habit.id, dateStr)}
                        className={cn(
                          'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0 min-h-[44px] min-w-[44px]',
                          status === 'done'
                            ? habit.type === 'positive'
                              ? 'bg-emerald-500 border-transparent'
                              : 'bg-red-500 border-transparent'
                            : status === 'failed'
                            ? 'bg-gray-800 border-transparent'
                            : 'border-gray-300 hover:border-gray-400'
                        )}
                      >
                        {status === 'done' && <Check size={16} className="text-white" />}
                        {status === 'failed' && <X size={16} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-gray-800 truncate">{habit.name}</p>
                          <span
                            className={cn(
                              'text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full shrink-0',
                              habit.type === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            )}
                          >
                            {habit.type}
                          </span>
                        </div>
                        {/* 7-day dot row */}
                        <div className="flex items-center gap-1">
                          {last7.map((day, i) => (
                            <div
                              key={i}
                              className={cn(
                                'rounded-full transition-all',
                                day.isToday ? 'w-3 h-3' : 'w-2 h-2',
                                day.status === 'done'
                                  ? 'bg-emerald-500'
                                  : day.status === 'failed'
                                  ? 'bg-red-400'
                                  : 'bg-gray-200'
                              )}
                              title={day.ds}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-0.5">
                          <span className="text-base">🔥</span>
                          <span className="text-sm font-black text-orange-500">{habit.streak}</span>
                        </div>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

