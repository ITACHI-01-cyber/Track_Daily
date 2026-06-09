import { motion } from 'motion/react';
import { format } from 'date-fns';
import { type Dispatch, type SetStateAction } from 'react';
import { Task, Habit, AppTheme } from './types';
import { DashboardHeader } from './dashboard/components/DashboardHeader';
import { ActivityInsights } from './dashboard/components/ActivityInsights';
import { ActiveDays } from './dashboard/components/ActiveDays';
import { FocusCard } from './dashboard/components/FocusCard';
import { MyPlans } from './dashboard/components/MyPlans';
import { MyActivities } from './dashboard/components/MyActivities';
import { AIAgentPanel } from './dashboard/components/AIAgentPanel';

interface DashboardViewProps {
  tasks: Task[];
  habits: Habit[];
  theme: AppTheme;
  chatMessages: { role: 'user' | 'model'; text: string }[];
  chatInput: string;
  isChatLoading: boolean;
  setSelectedDate: (date: Date) => void;
  setModalType: (type: 'task' | 'habit' | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setChatMessages: Dispatch<SetStateAction<{role: 'user' | 'model', text: string}[]>>;
  setChatInput: Dispatch<SetStateAction<string>>;
  setIsChatLoading: Dispatch<SetStateAction<boolean>>;
  toggleTask: (taskId: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
}

export function DashboardView({
  tasks,
  habits,
  chatMessages,
  chatInput,
  isChatLoading,
  setSelectedDate,
  setModalType,
  setIsModalOpen,
  setChatMessages,
  setChatInput,
  setIsChatLoading,
  toggleTask,
  toggleHabit,
}: DashboardViewProps) {
  const openTaskModal = () => {
    setSelectedDate(new Date());
    setModalType('task');
    setIsModalOpen(true);
  };

  const openHabitModal = () => {
    setModalType('habit');
    setIsModalOpen(true);
  };

  const selectDashboardDate = (date: Date) => {
    setSelectedDate(date);
    setModalType(null);
  };

  return (
    <div className="min-h-full bg-page-bg text-text-main font-sans -m-4 md:-m-6 lg:-m-10 p-4 md:p-8 lg:p-10 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader tasks={tasks} habits={habits} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
          <div className="xl:col-span-8 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ActivityInsights tasks={tasks} habits={habits} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-full"
              >
                <FocusCard tasks={tasks} habits={habits} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full"
              >
                <MyPlans tasks={tasks} habits={habits} />
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="xl:col-span-4"
          >
            <ActiveDays tasks={tasks} habits={habits} onSelectDate={selectDashboardDate} />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="xl:col-span-7"
          >
            <MyActivities
              tasks={tasks}
              habits={habits}
              onToggleTask={toggleTask}
              onToggleHabit={toggleHabit}
              onCreateHabit={openHabitModal}
              onCreateTask={openTaskModal}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="xl:col-span-5"
          >
            <AIAgentPanel
              tasks={tasks}
              habits={habits}
              chatMessages={chatMessages}
              chatInput={chatInput}
              isChatLoading={isChatLoading}
              setChatMessages={setChatMessages}
              setChatInput={setChatInput}
              setIsChatLoading={setIsChatLoading}
            />
          </motion.div>
        </div>

        <p className="sr-only">Dashboard data rendered at {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
      </div>
    </div>
  );
}
