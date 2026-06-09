import { format } from 'date-fns';
import { CheckCircle2, Circle, Plus, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Habit, Task } from '../../types';
import { cn } from '../../utils';

interface MyActivitiesProps {
  tasks: Task[];
  habits: Habit[];
  onToggleTask: (id: string) => void;
  onToggleHabit: (id: string, date: string) => void;
  onCreateHabit: () => void;
  onCreateTask: () => void;
}

export function MyActivities({ tasks, habits, onToggleTask, onToggleHabit, onCreateHabit, onCreateTask }: MyActivitiesProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysTasks = tasks.filter(task => task.date === today);
  const activities = [
    ...habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      meta: `${habit.type} habit • ${habit.streak} day streak`,
      completed: habit.history[today] === 'done',
      failed: habit.history[today] === 'failed',
      kind: 'habit' as const,
    })),
    ...todaysTasks.map(task => ({
      id: task.id,
      name: task.title,
      meta: `${task.priority} priority${task.startTime ? ` • ${task.startTime}` : ''}`,
      completed: task.completed,
      failed: false,
      kind: 'task' as const,
    })),
  ];

  const filteredActivities = activities.filter(activity => {
    if (activeFilter === 'Completed') return activity.completed;
    if (activeFilter === 'Pending') return !activity.completed;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-display font-semibold text-text-main">Daily Routines</h2>
        <div className="flex items-center gap-2 bg-page-bg p-1 rounded-full border border-border-strong overflow-x-auto scrollbar-hide">
          {['All', 'Pending', 'Completed'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-6 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                activeFilter === filter ? "bg-cta-btn text-white" : "text-text-muted hover:text-text-main"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredActivities.map(activity => (
          <button
            key={`${activity.kind}-${activity.id}`}
            onClick={() => activity.kind === 'habit' ? onToggleHabit(activity.id, today) : onToggleTask(activity.id)}
            className={cn(
              "rounded-[24px] p-6 text-left flex flex-col gap-8 group transition-all duration-300 h-full border shadow-xl relative overflow-hidden hover:-translate-y-1",
              activity.completed ? "bg-cta-btn/10 border-cta-btn/30" : "bg-card-surface border-border-strong"
            )}
          >
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-lg", activity.completed ? "bg-cta-btn text-white" : activity.failed ? "bg-orange-500 text-text-main" : "bg-panel-bg text-text-muted")}>
                {activity.completed ? <CheckCircle2 size={18} /> : activity.failed ? <XCircle size={18} /> : <Circle size={18} />}
              </div>
              <span className="text-[10px] uppercase font-bold text-text-muted">{activity.kind}</span>
            </div>

            <div className="relative z-10">
              <h4 className={cn("text-lg font-display font-bold", activity.completed ? "text-cta-btn line-through opacity-80" : "text-text-main")}>
                {activity.name}
              </h4>
              <p className="text-text-muted text-sm mt-1 capitalize">{activity.meta}</p>
            </div>
          </button>
        ))}

        <button
          onClick={onCreateHabit}
          className="border-2 border-dashed border-border-strong rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 hover:border-cta-btn hover:bg-cta-btn/5 transition-all group min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-full bg-border-strong flex items-center justify-center group-hover:bg-cta-btn group-hover:text-white transition-all">
            <Plus size={20} />
          </div>
          <span className="text-text-muted text-sm group-hover:text-text-main">New Habit</span>
        </button>

        <button
          onClick={onCreateTask}
          className="border-2 border-dashed border-border-strong rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-full bg-border-strong flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Plus size={20} />
          </div>
          <span className="text-text-muted text-sm group-hover:text-text-main">New Task</span>
        </button>
      </div>
    </div>
  );
}
