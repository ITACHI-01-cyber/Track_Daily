import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { Task, Habit } from '../../types';

interface DashboardHeaderProps {
  tasks: Task[];
  habits: Habit[];
}

export function DashboardHeader({ tasks, habits }: DashboardHeaderProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasksToday = tasks.filter(task => task.date === today);
  const habitsDone = habits.filter(habit => habit.history[today] === 'done').length;

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm">
          {tasksToday.filter(task => task.completed).length}/{tasksToday.length} tasks and {habitsDone}/{habits.length} habits completed today
        </p>
      </div>

      <div className="relative group w-full md:w-72">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-lime transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search tasks and habits..."
          className="bg-card-bg border border-card-border rounded-full py-2.5 pl-11 pr-6 text-sm w-full focus:outline-none focus:border-brand-lime transition-all text-white"
        />
      </div>
    </header>
  );
}
