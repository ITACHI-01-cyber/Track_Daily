import { Habit, Task } from '../../types';

interface MyPlansProps {
  habits: Habit[];
  tasks: Task[];
}

export function MyPlans({ habits, tasks }: MyPlansProps) {
  const topHabits = [...habits].sort((a, b) => b.streak - a.streak).slice(0, 2);
  const openTasks = tasks.filter(task => !task.completed).slice(0, 2);
  const plans = [
    ...topHabits.map(habit => ({
      id: habit.id,
      name: habit.name,
      goal: `${habit.streak} day streak`,
      progress: Math.min((habit.streak / 30) * 100, 100),
      target: '30 day target',
    })),
    ...openTasks.map(task => ({
      id: task.id,
      name: task.title,
      goal: task.priority ? `${task.priority} priority task` : 'Task tracker',
      progress: task.completed ? 100 : 15,
      target: task.date,
    })),
  ].slice(0, 3);

  return (
    <div className="bg-card-bg border border-card-border rounded-[32px] p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-display font-semibold text-white">Active Plans</h3>
        <span className="text-xs text-gray-500">{plans.length} tracked</span>
      </div>

      <div className="flex flex-col gap-5">
        {plans.length === 0 ? (
          <div className="text-sm text-gray-400 border border-dashed border-card-border rounded-2xl p-6 text-center">
            Add habits or tasks to see plans here.
          </div>
        ) : (
          plans.map(plan => (
            <div key={plan.id}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h4 className="text-white font-display font-bold">{plan.name}</h4>
                  <p className="text-gray-400 text-xs mt-1">{plan.goal}</p>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{plan.target}</span>
              </div>
              <div className="overflow-hidden h-3 rounded-full bg-gray-800">
                <div className="h-full bg-brand-lime transition-all duration-700" style={{ width: `${plan.progress}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
