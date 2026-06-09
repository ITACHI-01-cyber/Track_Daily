import React from 'react';
import { format, addDays } from 'date-fns';
import { Plus, Check, X, Flame, Pencil, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';

export const HabitManagerView = () => {
  const { habits, theme, setModalType, setIsModalOpen, setEditingItem, deleteHabit } = useAppContext();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Habit Management</h2>
        <button
          onClick={() => { setModalType('habit'); setIsModalOpen(true); }}
          className={cn('flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-opacity min-h-[44px]', theme.primary)}
        >
          <Plus size={18} /> New Habit
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card-surface rounded-2xl border border-dashed border-gray-300">
            <p className="text-text-muted italic">No habits found. Create your first habit!</p>
          </div>
        ) : (
          habits.map((habit: any) => (
            <div key={habit.id} className="bg-card-surface p-5 rounded-2xl shadow-sm border border-border-strong relative">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md',
                    habit.type === 'positive' ? 'bg-emerald-500' : 'bg-red-500'
                  )}
                >
                  {habit.type === 'positive' ? <Check size={24} /> : <X size={24} />}
                </div>
                <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-xs font-bold text-orange-600">{habit.streak}</span>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">{habit.name}</h3>
              <p className="text-xs text-text-muted mb-4 capitalize">{habit.type} Habit • Daily</p>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 7 })
                  .map((_, i) => {
                    const date = addDays(new Date(), -i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const status = habit.history[dateStr] || 'none';
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 aspect-square rounded-md border transition-colors flex items-center justify-center',
                          status === 'done'
                            ? habit.type === 'positive'
                              ? 'bg-emerald-500 border-emerald-600'
                              : 'bg-red-500 border-red-600'
                            : status === 'failed'
                            ? 'bg-gray-800 border-gray-900'
                            : 'bg-page-bg border-border-strong'
                        )}
                        title={format(date, 'MMM do')}
                      >
                        {status === 'done' && <Check size={8} className="text-white" />}
                        {status === 'failed' && <X size={8} className="text-white" />}
                      </div>
                    );
                  })
                  .reverse()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingItem(habit); setModalType('habit'); setIsModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold text-text-muted hover:text-indigo-500 bg-page-bg rounded-xl transition-colors min-h-[44px]"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold text-text-muted hover:text-red-500 bg-page-bg rounded-xl transition-colors min-h-[44px]"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
