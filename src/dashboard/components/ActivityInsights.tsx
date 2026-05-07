import { addDays, format, startOfWeek } from 'date-fns';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { Habit, Task } from '../../types';

interface ActivityInsightsProps {
  tasks: Task[];
  habits: Habit[];
}

export function ActivityInsights({ tasks, habits }: ActivityInsightsProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const data = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(weekStart, index);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(task => task.date === dateKey);
    const completedTasks = dayTasks.filter(task => task.completed).length;
    const completedHabits = habits.filter(habit => habit.history[dateKey] === 'done').length;
    const failedHabits = habits.filter(habit => habit.history[dateKey] === 'failed').length;

    return {
      name: format(date, 'EEE'),
      completedTasks,
      completedHabits,
      failedHabits,
      totalActivity: completedTasks + completedHabits,
    };
  });

  const totalTasksDone = data.reduce((sum, day) => sum + day.completedTasks, 0);
  const totalHabitsDone = data.reduce((sum, day) => sum + day.completedHabits, 0);
  const totalFailures = data.reduce((sum, day) => sum + day.failedHabits, 0);
  const possibleHabitCompletions = Math.max(habits.length * 7, 1);
  const consistency = Math.round((totalHabitsDone / possibleHabitCompletions) * 100);

  return (
    <div className="bg-card-bg border border-card-border rounded-[32px] p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-display font-semibold text-white">Activity Insights</h2>
        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          Weekly View <ChevronDown size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <InsightChart
          data={data}
          dataKey="completedHabits"
          color="#D7FE63"
          label="Habit Wins"
          value={totalHabitsDone.toString()}
          caption={`Consistency: ${consistency}%`}
        />
        <InsightChart
          data={data}
          dataKey="completedTasks"
          color="#4B6BFB"
          label="Tasks Done"
          value={totalTasksDone.toString()}
          caption={`${tasks.length} total trackers`}
        />
        <InsightChart
          data={data}
          dataKey="failedHabits"
          color="#FF8C00"
          label="Missed Habits"
          value={totalFailures.toString()}
          caption="Use misses as planning signals"
        />
      </div>
    </div>
  );
}

interface InsightChartProps {
  data: Record<string, string | number>[];
  dataKey: string;
  color: string;
  label: string;
  value: string;
  caption: string;
}

function InsightChart({ data, dataKey, color, label, value, caption }: InsightChartProps) {
  const gradientId = `gradient-${dataKey}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: '#1C1D21', border: '1px solid #2A2C32', borderRadius: 12, color: '#fff' }}
              labelStyle={{ color: '#D7FE63' }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} dot={{ r: 4, fill: color }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div>
        <span className="text-sm text-gray-400">{label}</span>
        <div className="text-3xl font-display font-bold mt-1 text-white">{value}</div>
        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-4">{caption}</div>
      </div>
    </div>
  );
}
