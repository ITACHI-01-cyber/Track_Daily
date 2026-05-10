/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Upload, 
  Image as ImageIcon,
  Flame,
  Trophy,
  Pencil,
  Sun,
  Activity,
  Trash2,
  Check,
  X,
  Sparkles,
  Search,
  Loader2,
  Grid,
  Wifi,
  WifiOff,
  MoreVertical,
  Send,
  Bot,
  User as UserIcon
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  isToday,
  parseISO
} from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import { Habit, Task, Badge, AppTheme, AppData, HabitType, User } from './types';
import { cn } from './utils';
import { DashboardView } from './DashboardView';
import { DEFAULT_THEMES, BADGES } from './constants';

const API_BASE = window.location.hostname === 'localhost' ? '/api' : 'https://track-daily.onrender.com/api';

const DEFAULT_USER: User = {
  id: 'default',
  email: 'user@example.com',
  username: 'user',
  firstName: 'User',
  lastName: '',
  avatarUrl: '',
};

export default function App() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'grid' | 'habits' | 'stats' | 'settings' | 'dashboard'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEMES[0]);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [bgImage, setBgImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'task' | 'habit' | null>(null);
  const [editingItem, setEditingItem] = useState<Task | Habit | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hello! I am your AI productivity agent. How can I help you crush your goals today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- Persistence ---

  // --- Persistence ---
  useEffect(() => {
    const fetchData = async () => {
      let serverData: AppData | null = null;
      let localData: AppData | null = null;

      // Try to get local data first
      const savedLocal = localStorage.getItem('habit_tracker_data');
      if (savedLocal) {
        try {
          localData = JSON.parse(savedLocal) as AppData;
        } catch (e) {
          console.error('Failed to parse local data', e);
        }
      }

      // Try to get server data
      try {
        const response = await fetch(`${API_BASE}/data?userId=${currentUser.id}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid content type (backend might still be booting)");
        }
        
        serverData = await response.json() as AppData;
        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
        // Auto-retry connection if backend is waking up from sleep
        if (retryCount < 12) {
          console.log(`Backend waking up from sleep. Retrying... (${retryCount + 1}/12)`);
          setTimeout(() => setRetryCount(prev => prev + 1), 5000);
        } else {
          console.error('Failed to load data from server after retries', e);
        }
      }

      // Resolve conflict using timestamps (Last-Write-Wins)
      const dataToUse = (serverData?.lastUpdated || 0) >= (localData?.lastUpdated || 0) 
        ? (serverData || localData) 
        : (localData || serverData);

      if (dataToUse && Object.keys(dataToUse).length > 0) {
        setHabits(dataToUse.habits || []);
        setTasks(dataToUse.tasks || []);
        setTheme(dataToUse.theme || DEFAULT_THEMES[0]);
        setUnlockedBadges(dataToUse.badges?.map(b => b.id) || []);
        if (dataToUse.theme?.background) setBgImage(dataToUse.theme.background);
      }
    };
    fetchData();

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser.id, retryCount]);

  const saveDataToServer = async (data: AppData) => {
    setIsSaving(true);
    setSyncProgress(0);
    
    // Simulate progress for better UX as requested
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const response = await fetch(`${API_BASE}/data?userId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      clearInterval(interval);
      setSyncProgress(100);

      if (response.ok) {
        setIsOnline(true);
        setHasPendingChanges(false);
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      clearInterval(interval);
      console.error('Failed to save data to server', e);
      setIsOnline(false);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setSyncProgress(0);
      }, 1000);
    }
  };

  const handleManualSync = () => {
    const data: AppData = {
      habits,
      tasks,
      theme: { ...theme, background: bgImage },
      badges: BADGES.filter(b => unlockedBadges.includes(b.id)),
      lastUpdated: Date.now()
    };
    saveDataToServer(data);
  };

  useEffect(() => {
    // Skip initial empty state to avoid overwriting with empty data
    if (habits.length === 0 && tasks.length === 0 && unlockedBadges.length === 0) return;

    const data: AppData = {
      habits,
      tasks,
      theme: { ...theme, background: bgImage },
      badges: BADGES.filter(b => unlockedBadges.includes(b.id)),
      lastUpdated: Date.now()
    };
    localStorage.setItem('habit_tracker_data', JSON.stringify(data));
    setHasPendingChanges(true);
    // Auto-save to server on changes
    saveDataToServer(data);

    // Badge Logic
    const newBadges = [...unlockedBadges];
    
    // Streak badges
    const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
    if (maxStreak >= 3 && !newBadges.includes('streak-3')) newBadges.push('streak-3');
    if (maxStreak >= 7 && !newBadges.includes('streak-7')) newBadges.push('streak-7');

    // Habit Master (5 habits in one day)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const habitsDoneToday = habits.filter(h => h.history[todayStr]).length;
    if (habitsDoneToday >= 5 && !newBadges.includes('habit-master')) newBadges.push('habit-master');

    // Planner Pro (10 tasks in a week)
    if (tasks.length >= 10 && !newBadges.includes('planner-pro')) newBadges.push('planner-pro');

    if (newBadges.length !== unlockedBadges.length) {
      setUnlockedBadges(newBadges);
    }
  }, [habits, tasks, theme, unlockedBadges, bgImage]);

  // --- Helpers ---
  const exportData = () => {
    const data: AppData = {
      habits,
      tasks,
      theme: { ...theme, background: bgImage },
      badges: BADGES.filter(b => unlockedBadges.includes(b.id))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit_tracker_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as AppData;
        setHabits(parsed.habits || []);
        setTasks(parsed.tasks || []);
        setTheme(parsed.theme || DEFAULT_THEMES[0]);
        setUnlockedBadges(parsed.badges?.map(b => b.id) || []);
        if (parsed.theme?.background) setBgImage(parsed.theme.background);
      } catch (e) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: uuidv4() };
    setTasks([...tasks, newTask]);
    closeModal();
  };

  const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'history' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      streak: 0,
      history: {},
      createdAt: new Date().toISOString()
    };
    setHabits([...habits, newHabit]);
    closeModal();
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? {...t, ...data} : t));
    closeModal();
  };

  const updateHabit = (id: string, data: Partial<Habit>) => {
    setHabits(habits.map(h => h.id === id ? {...h, ...data} : h));
    closeModal();
  };


  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const toggleHabit = (habitId: string, date: string) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const newHistory = { ...h.history };
        const current = newHistory[date] || 'none';
        
        // Cycle: none -> done -> failed -> none
        let next: 'done' | 'failed' | 'none' = 'done';
        if (current === 'done') next = 'failed';
        else if (current === 'failed') next = 'none';
        
        newHistory[date] = next;
        
        // Recalculate streak
        let streak = 0;
        let currDate = new Date();
        while (true) {
          const dateStr = format(currDate, 'yyyy-MM-dd');
          if (newHistory[dateStr] === 'done') {
            streak++;
            currDate = addDays(currDate, -1);
          } else {
            break;
          }
        }

        return { ...h, history: newHistory, streak };
      }
      return h;
    }));
  };

  const deleteHabit = (id: string) => setHabits(habits.filter(h => h.id !== id));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  // --- Views ---
  const DayView = () => {
    const dayTasks = tasks.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'));
    const dayHabits = habits;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{format(selectedDate, 'EEEE, MMMM do')}</h2>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors">Today</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <section className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2 className={theme.accent} size={20} /> Tasks</h3>
              <button 
                onClick={() => { setModalType('task'); setIsModalOpen(true); }}
                className={cn("p-1 rounded-full text-white hover:opacity-90 transition-opacity", theme.primary)}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {dayTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">No tasks for today. Add one!</p>
              ) : (
                dayTasks.map(task => (
                  <motion.div 
                    layout
                    key={task.id} 
                    className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl group hover:bg-gray-100/50 transition-colors"
                  >
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed ? cn(theme.primary, "border-transparent") : "border-gray-300"
                      )}
                    >
                      {task.completed && <Check size={14} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={cn("font-medium", task.completed && "line-through text-gray-400")}>{task.title}</p>
                      {task.startTime && <p className="text-xs text-gray-500">{task.startTime} - {task.endTime}</p>}
                    </div>
                    <button onClick={() => { setEditingItem(task); setModalType('task'); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-500 transition-all"><Pencil size={16} /></button>
                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Habits Section */}
          <section className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Flame className="text-orange-500" size={20} /> Habits</h3>
              <button 
                onClick={() => { setModalType('habit'); setIsModalOpen(true); }}
                className={cn("p-1 rounded-full text-white hover:opacity-90 transition-opacity", theme.primary)}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {dayHabits.length === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">No habits tracked. Start a new one!</p>
              ) : (
                dayHabits.map(habit => {
                  const status = habit.history[format(selectedDate, 'yyyy-MM-dd')] || 'none';
                  return (
                    <div key={habit.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl group hover:bg-gray-100/50 transition-colors">
                      <button 
                        onClick={() => toggleHabit(habit.id, format(selectedDate, 'yyyy-MM-dd'))}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          status === 'done' ? (habit.type === 'positive' ? "bg-emerald-500 border-transparent" : "bg-red-500 border-transparent") : 
                          status === 'failed' ? "bg-gray-800 border-transparent" : "border-gray-300"
                        )}
                      >
                        {status === 'done' && <Check size={14} className="text-white" />}
                        {status === 'failed' && <X size={14} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className="font-medium">{habit.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", habit.type === 'positive' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                            {habit.type}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Flame size={12} className="text-orange-500" /> {habit.streak} day streak</span>
                        </div>
                      </div>
                      <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
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

  const WeekView = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Week of {format(start, 'MMM do')}</h2>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors">This Week</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {days.map(day => {
            const dayTasks = tasks.filter(t => t.date === format(day, 'yyyy-MM-dd'));
            const isTodayDay = isToday(day);
            return (
              <div key={day.toString()} className={cn("bg-white/80 backdrop-blur-sm p-4 rounded-2xl border min-h-[200px] flex flex-col", isTodayDay ? "border-indigo-500 ring-1 ring-indigo-500 shadow-lg" : "border-white/20 shadow-sm")}>
                <div className="text-center mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{format(day, 'EEE')}</p>
                  <p className={cn("text-lg font-bold", isTodayDay ? "text-indigo-600" : "text-gray-700")}>{format(day, 'd')}</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[150px] scrollbar-hide">
                  {dayTasks.map(task => (
                    <div key={task.id} className={cn("text-[10px] p-1.5 rounded-lg truncate", task.completed ? "bg-gray-100 text-gray-400 line-through" : cn(theme.secondary, theme.accent))}>
                      {task.title}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => { setSelectedDate(day); setModalType('task'); setIsModalOpen(true); }}
                  className="mt-2 w-full py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-lg transition-colors"
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const monthStart = startOfWeek(start);
    const monthEnd = endOfWeek(end);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{format(selectedDate, 'MMMM yyyy')}</h2>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors">Today</button>
            <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/20 overflow-hidden min-w-[700px]">
          <div className="grid grid-cols-7 bg-gray-50/50 border-bottom border-white/20">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map(day => {
              const dayTasks = tasks.filter(t => t.date === format(day, 'yyyy-MM-dd'));
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isTodayDay = isToday(day);
              
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "min-h-[100px] p-2 border-t border-r border-white/20 transition-colors hover:bg-white/50 cursor-pointer",
                    !isCurrentMonth && "bg-gray-50/30 opacity-40",
                    isTodayDay && cn(theme.secondary, "bg-opacity-50")
                  )}
                  onClick={() => { setSelectedDate(day); setActiveTab('day'); }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn("text-sm font-bold", isTodayDay ? cn(theme.primary, "text-white w-6 h-6 flex items-center justify-center rounded-full") : "text-gray-700")}>
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && <span className={cn("w-1.5 h-1.5 rounded-full", theme.primary)}></span>}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <div key={task.id} className={cn("text-[9px] px-1 py-0.5 rounded truncate", theme.secondary, theme.accent)}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && <div className="text-[8px] text-gray-400 font-medium">+{dayTasks.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
    );
  };

  const StatsView = () => {
    // Generate data for habit completion over last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), -i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const completedCount = habits.reduce((acc, h) => acc + (h.history[dateStr] ? (h.type === 'positive' ? 1 : -1) : 0), 0);
      return {
        name: format(date, 'EEE'),
        score: completedCount,
        date: dateStr
      };
    }).reverse();

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Analytics & Progress</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Habit Score Chart */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Activity className="text-indigo-500" size={20} /> Habit Performance Score</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm text-gray-500 italic">Score = (Positive Habits Done) - (Negative Habits Done)</p>
          </div>

          {/* Badges Section */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Trophy className="text-yellow-500" size={20} /> Achievements</h3>
            <div className="grid grid-cols-2 gap-4">
              {BADGES.map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                return (
                  <div key={badge.id} className={cn("p-4 rounded-2xl border transition-all flex flex-col items-center text-center", isUnlocked ? "bg-yellow-50 border-yellow-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-50 grayscale")}>
                    <span className="text-3xl mb-2">{badge.icon}</span>
                    <p className="font-bold text-sm text-gray-800">{badge.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">{badge.description}</p>
                    {isUnlocked && <span className="mt-2 text-[8px] font-bold uppercase text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Unlocked</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    return (
      <div className="space-y-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800">Preferences</h2>
        
        {/* Themes */}
        <section className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20">
          <h3 className="text-lg font-semibold mb-4">Color Theme</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {DEFAULT_THEMES.map(t => (
              <button 
                key={t.name}
                onClick={() => setTheme(t)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left group",
                  theme.name === t.name ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className={cn("w-8 h-8 rounded-full mb-2", t.primary)}></div>
                <p className="text-sm font-bold text-gray-700">{t.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Background Image */}
        <section className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon size={20} /> Background Image</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Paste image URL here..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={bgImage}
                onChange={(e) => setBgImage(e.target.value)}
              />
              <button 
                onClick={() => setBgImage('')}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
            {bgImage && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                <img src={bgImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Live Preview</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Download size={20} /> Data Management</h3>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Sync Status</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <Wifi size={12} /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                    <WifiOff size={12} /> Offline
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Data is saved locally in your browser and automatically synced to the MongoDB database when online.
            </p>
            <button 
              onClick={handleManualSync}
              disabled={isSaving}
              className="w-full py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <div className="flex items-center gap-2">
                <Activity size={14} className={isSaving ? "animate-spin" : ""} />
                {isSaving ? `Syncing ${syncProgress}%` : "Sync to Database"}
              </div>
              {isSaving && (
                <div className="w-1/2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                  />
                </div>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={exportData}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Download size={18} /> Export JSON
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-indigo-100 text-indigo-600 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-colors cursor-pointer">
              <Upload size={18} /> Import JSON
              <input type="file" accept=".json" className="hidden" onChange={importData} />
            </label>
          </div>
        </section>

        {/* Database Inspector */}
        <section className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Search size={20} /> Database Inspector</h3>
            <a 
            href={`${API_BASE}/data`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Open API <X size={12} className="rotate-45" />
            </a>
          </div>
          <p className="text-sm text-gray-500 mb-4">This is the raw JSON data currently stored in your MongoDB database. It includes all your habits, tasks, and settings.</p>
          <div className="bg-gray-900 rounded-2xl p-4 overflow-hidden">
            <pre className="text-[10px] text-emerald-400 font-mono overflow-auto max-h-[300px] scrollbar-hide">
              {JSON.stringify({
                habits,
                tasks,
                theme: { ...theme, background: bgImage },
                badges: BADGES.filter(b => unlockedBadges.includes(b.id))
              }, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    );
  };

  // --- Modal ---
  const Modal = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<HabitType>('positive');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const isEditing = editingItem !== null;

    useEffect(() => {
      if (isEditing && editingItem) {
        if (modalType === 'task' && 'completed' in editingItem) {
          setTitle(editingItem.title);
          setPriority(editingItem.priority || 'MEDIUM');
          setStartTime(editingItem.startTime || '09:00');
          setEndTime(editingItem.endTime || '10:00');
        } else if (modalType === 'habit' && 'streak' in editingItem) {
          setTitle(editingItem.name);
          setType(editingItem.type);
        }
      } else {
        setTitle('');
        setType('positive');
        setPriority('MEDIUM');
        setStartTime('09:00');
        setEndTime('10:00');
      }
    }, [isEditing, editingItem, modalType]);

    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90dvh] flex flex-col"
        >
          <div className={cn("p-6 text-white flex justify-between items-center", theme.primary)}>
            <h3 className="text-xl font-bold">{isEditing ? 'Edit' : 'Add New'} {modalType === 'task' ? 'Task' : 'Habit'}</h3>
            <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
          </div>
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title / Name</label>
              <input 
                autoFocus
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={modalType === 'task' ? "What needs to be done?" : "What habit to track?"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {modalType === 'task' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Time</label>
                    <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Time</label>
                    <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Priority</label>
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                      <button 
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold uppercase border-2 transition-all",
                          priority === p ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-100 text-gray-400"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Habit Type</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setType('positive')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2",
                      type === 'positive' ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-100 text-gray-400"
                    )}
                  >
                    <Check size={18} /> Positive
                  </button>
                  <button 
                    onClick={() => setType('negative')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2",
                      type === 'negative' ? "bg-red-500 border-red-500 text-white" : "border-gray-100 text-gray-400"
                    )}
                  >
                    <X size={18} /> Negative
                  </button>
                </div>
              </div>
            )}

            <button 
              disabled={!title}
              onClick={() => {
                if (isEditing && editingItem) {
                  if (modalType === 'task' && 'completed' in editingItem) {
                    updateTask(editingItem.id, { title, priority, startTime, endTime });
                  } else if (modalType === 'habit' && 'streak' in editingItem) {
                    updateHabit(editingItem.id, { name: title, type });
                  }
                } else {
                  if (modalType === 'task') {
                    addTask({ title, description, date: format(selectedDate, 'yyyy-MM-dd'), completed: false, priority, startTime, endTime });
                  } else {
                    addHabit({ name: title, type, frequency: 'daily' });
                  }
                }
              }}
              className={cn("w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed", theme.primary)}
            >
              {isEditing ? 'Update' : 'Create'} {modalType === 'task' ? 'Task' : 'Habit'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const GridView = () => {
    const start = startOfWeek(selectedDate);
    const days = eachDayOfInterval({ start, end: addDays(start, 6) });

    return (
      <div className="space-y-6 overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Weekly Habit Matrix</h2>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors">This Week</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/20 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/20">Habit / Task</th>
                {days.map(day => (
                  <th key={day.toString()} className="p-4 text-center border-b border-white/20">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{format(day, 'EEE')}</p>
                    <p className={cn("text-sm font-bold", isToday(day) ? "text-indigo-600" : "text-gray-700")}>{format(day, 'd')}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", habit.type === 'positive' ? "bg-emerald-500" : "bg-red-500")}></div>
                      <span className="font-bold text-gray-700">{habit.name}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const status = habit.history[dateStr] || 'none';
                    return (
                      <td key={dateStr} className="p-4 border-b border-l border-white/20 text-center">
                        <button 
                          onClick={() => toggleHabit(habit.id, dateStr)}
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all mx-auto",
                            status === 'done' ? (habit.type === 'positive' ? "bg-emerald-500 border-transparent" : "bg-red-500 border-transparent") : 
                            status === 'failed' ? "bg-gray-800 border-transparent" : "border-gray-100 hover:border-gray-300"
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
                  <td colSpan={8} className="p-10 text-center text-gray-400 italic">No habits tracked. Add some in the Habits tab!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  const HabitManagerView = () => {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Habit Management</h2>
          <button 
            onClick={() => { setModalType('habit'); setIsModalOpen(true); }}
            className={cn("flex items-center gap-2 px-4 py-2 text-white rounded-xl font-bold transition-opacity", theme.primary)}
          >
            <Plus size={20} /> New Habit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-400 italic">No habits found. Create your first habit!</p>
            </div>
          ) : (
            habits.map(habit => (
              <div key={habit.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white/20 group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md", habit.type === 'positive' ? "bg-emerald-500" : "bg-red-500")}>
                    {habit.type === 'positive' ? <Check size={24} /> : <X size={24} />}
                  </div>
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-xs font-bold text-orange-600">{habit.streak}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{habit.name}</h3>
                <p className="text-xs text-gray-500 mb-4 capitalize">{habit.type} Habit • Daily</p>
                
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(new Date(), -i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const status = habit.history[dateStr] || 'none';
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 aspect-square rounded-md border transition-colors flex items-center justify-center",
                          status === 'done' ? (habit.type === 'positive' ? "bg-emerald-500 border-emerald-600" : "bg-red-500 border-red-600") : 
                          status === 'failed' ? "bg-gray-800 border-gray-900" : "bg-gray-50 border-gray-100"
                        )}
                        title={format(date, 'MMM do')}
                      >
                        {status === 'done' && <Check size={8} className="text-white" />}
                        {status === 'failed' && <X size={8} className="text-white" />}
                      </div>
                    );
                  }).reverse()}
                </div>

                <button
                  onClick={() => { setEditingItem(habit); setModalType('habit'); setIsModalOpen(true); }}
                  className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-indigo-500 transition-all"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
      <button 
        onClick={() => { onClick(); setIsMobileMenuOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
          active ? cn(theme.primary, "text-white shadow-lg shadow-indigo-100") : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <span className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-gray-400 group-hover:text-gray-600")}>
          {icon}
        </span>
        <span className="font-bold text-sm">{label}</span>
      </button>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen font-sans text-gray-900 relative overflow-hidden">
      {/* Background Image Layer */}
      {bgImage && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
        </div>
      )}

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row h-[100dvh] overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-white/20 p-4 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-lg", theme.primary)}>
              ✓
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tighter text-gray-800">HABIT TRACKER</h1>
              <p className="text-[10px] text-gray-500">Build better habits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-[10px] font-bold text-indigo-500 animate-pulse uppercase flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Syncing</span>
            ) : isOnline ? (
              <Wifi size={16} className="text-emerald-500" />
            ) : (
              <WifiOff size={16} className="text-orange-500" />
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 ml-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar / Mobile Drawer */}
        <aside className={cn(
          "absolute lg:relative inset-y-0 right-0 lg:left-0 z-50 w-64 bg-white/95 lg:bg-white/90 backdrop-blur-xl border-l lg:border-l-0 lg:border-r border-white/20 flex flex-col p-6 shrink-0 transition-transform duration-300 shadow-2xl lg:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="flex items-center justify-between lg:hidden mb-8">
            <h2 className="font-black text-gray-800 tracking-tighter">MENU</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-10 px-2">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg font-bold text-lg", theme.primary)}>
              ✓
            </div>
            <div className="hidden lg:block flex-1">
              <h1 className="text-xl font-black tracking-tighter text-gray-800">HABIT TRACKER</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">Build better habits, one day at a time</p>
            </div>
          </div>

          {/* Sync Status Section */}
          <div className="hidden lg:block mb-6 px-2">
            <div className="flex flex-col gap-1">
              {isSaving ? (
                <p className="text-[8px] font-bold text-indigo-500 animate-pulse uppercase">Syncing {syncProgress}%</p>
              ) : isOnline ? (
                <>
                  <Wifi size={8} className="text-emerald-500" />
                  <p className="text-[8px] font-bold text-emerald-500 uppercase">Connected</p>
                </>
              ) : (
                <>
                  <WifiOff size={8} className="text-orange-500" />
                  <p className="text-[8px] font-bold text-orange-500 uppercase">Offline</p>
                </>
              )}
            </div>
            
            {hasPendingChanges && !isSaving && (
              <button 
                onClick={handleManualSync}
                className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 bg-indigo-500 text-white rounded-md text-[8px] font-bold uppercase hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <Upload size={8} /> Add to MongoDB
              </button>
            )}
            
            {isSaving && (
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${syncProgress}%` }}
                />
              </div>
            )}
          </div>

          <nav className="flex flex-col space-y-2 w-full flex-1">
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavItem active={activeTab === 'day'} onClick={() => setActiveTab('day')} icon={<Sun size={20} />} label="Day View" />
            <NavItem active={activeTab === 'week'} onClick={() => setActiveTab('week')} icon={<CalendarIcon size={20} />} label="Week View" />
            <NavItem active={activeTab === 'month'} onClick={() => setActiveTab('month')} icon={<CalendarIcon size={20} />} label="Month View" />
            <NavItem active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<Grid size={20} />} label="Grid Matrix" />
            <NavItem active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={<Activity size={20} />} label="Habits" />
            <div className="h-px bg-gray-100 my-4 mx-2 shrink-0"></div>
            <NavItem active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={20} />} label="Analytics" />
            <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Settings" />
          </nav>

          <div className="mt-auto pt-6 px-2">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Daily Progress</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", theme.primary)} 
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-gray-500 mt-2">
                {tasks.filter(t => t.completed).length}/{tasks.length} Tasks Done
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <DashboardView
                  tasks={tasks}
                  habits={habits}
                  theme={theme}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  isChatLoading={isChatLoading}
                  setSelectedDate={setSelectedDate}
                  setModalType={setModalType}
                  setIsModalOpen={setIsModalOpen}
                  setChatMessages={setChatMessages}
                  setChatInput={setChatInput}
                  setIsChatLoading={setIsChatLoading}
                  toggleTask={toggleTask}
                  toggleHabit={toggleHabit} />}
                {activeTab === 'day' && <DayView />}
                {activeTab === 'week' && <WeekView />}
                {activeTab === 'month' && <MonthView />}
                {activeTab === 'grid' && <GridView />}
                {activeTab === 'habits' && <HabitManagerView />}
                {activeTab === 'stats' && <StatsView />}
                {activeTab === 'settings' && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Modal />
    </div>
  );
}
