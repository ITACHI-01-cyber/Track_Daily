/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  User as UserIcon,
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
  parseISO,
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
  Area,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import { Habit, Task, Badge, AppTheme, AppData, HabitType, User } from './types';
import { cn } from './utils';
import { DashboardView } from './DashboardView';
import { DEFAULT_THEMES, BADGES } from './constants';

const API_BASE =
  window.location.hostname === 'localhost'
    ? '/api'
    : 'https://track-daily.onrender.com/api';

const DEFAULT_USER: User = {
  id: 'default',
  email: 'user@example.com',
  username: 'user',
  firstName: 'User',
  lastName: '',
  avatarUrl: '',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<
    'day' | 'week' | 'month' | 'grid' | 'habits' | 'stats' | 'settings' | 'dashboard'
  >('day');
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
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hello! I am your AI productivity agent. How can I help you crush your goals today?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  // FAB action sheet state
  const [isFabOpen, setIsFabOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    const fetchData = async () => {
      let serverData: AppData | null = null;
      let localData: AppData | null = null;
      const savedLocal = localStorage.getItem('habit_tracker_data');
      if (savedLocal) {
        try {
          localData = JSON.parse(savedLocal) as AppData;
        } catch (e) {
          console.error('Failed to parse local data', e);
        }
      }
      try {
        const response = await fetch(`${API_BASE}/data?userId=${currentUser.id}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid content type');
        }
        serverData = (await response.json()) as AppData;
        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
        if (retryCount < 12) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 5000);
        }
      }
      const dataToUse =
        (serverData?.lastUpdated || 0) >= (localData?.lastUpdated || 0)
          ? serverData || localData
          : localData || serverData;
      if (dataToUse && Object.keys(dataToUse).length > 0) {
        setHabits(dataToUse.habits || []);
        setTasks(dataToUse.tasks || []);
        setTheme(dataToUse.theme || DEFAULT_THEMES[0]);
        setUnlockedBadges(dataToUse.badges?.map((b) => b.id) || []);
        if (dataToUse.theme?.background) setBgImage(dataToUse.theme.background);
      }
    };
    fetchData();
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
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 10;
      });
    }, 100);
    try {
      const response = await fetch(`${API_BASE}/data?userId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      clearInterval(interval);
      setSyncProgress(100);
      if (response.ok) { setIsOnline(true); setHasPendingChanges(false); }
      else setIsOnline(false);
    } catch (e) {
      clearInterval(interval);
      setIsOnline(false);
    } finally {
      setTimeout(() => { setIsSaving(false); setSyncProgress(0); }, 1000);
    }
  };

  const handleManualSync = () => {
    const data: AppData = {
      habits,
      tasks,
      theme: { ...theme, background: bgImage },
      badges: BADGES.filter((b) => unlockedBadges.includes(b.id)),
      lastUpdated: Date.now(),
    };
    saveDataToServer(data);
  };

  useEffect(() => {
    if (habits.length === 0 && tasks.length === 0 && unlockedBadges.length === 0) return;
    const data: AppData = {
      habits,
      tasks,
      theme: { ...theme, background: bgImage },
      badges: BADGES.filter((b) => unlockedBadges.includes(b.id)),
      lastUpdated: Date.now(),
    };
    localStorage.setItem('habit_tracker_data', JSON.stringify(data));
    setHasPendingChanges(true);
    saveDataToServer(data);
    const newBadges = [...unlockedBadges];
    const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;
    if (maxStreak >= 3 && !newBadges.includes('streak-3')) newBadges.push('streak-3');
    if (maxStreak >= 7 && !newBadges.includes('streak-7')) newBadges.push('streak-7');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const habitsDoneToday = habits.filter((h) => h.history[todayStr]).length;
    if (habitsDoneToday >= 5 && !newBadges.includes('habit-master')) newBadges.push('habit-master');
    if (tasks.length >= 10 && !newBadges.includes('planner-pro')) newBadges.push('planner-pro');
    if (newBadges.length !== unlockedBadges.length) setUnlockedBadges(newBadges);
  }, [habits, tasks, theme, unlockedBadges, bgImage]);

  // --- Helpers ---
  const exportData = () => {
    const data: AppData = {
      habits,
      tasks,
      theme: { ...theme, background: bgImage },
      badges: BADGES.filter((b) => unlockedBadges.includes(b.id)),
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
        setUnlockedBadges(parsed.badges?.map((b) => b.id) || []);
        if (parsed.theme?.background) setBgImage(parsed.theme.background);
      } catch (e) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };
  const addTask = (task: Omit<Task, 'id'>) => { setTasks([...tasks, { ...task, id: uuidv4() }]); closeModal(); };
  const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'history' | 'createdAt'>) => {
    setHabits([...habits, { ...habit, id: uuidv4(), streak: 0, history: {}, createdAt: new Date().toISOString() }]);
    closeModal();
  };
  const updateTask = (id: string, data: Partial<Task>) => { setTasks(tasks.map((t) => (t.id === id ? { ...t, ...data } : t))); closeModal(); };
  const updateHabit = (id: string, data: Partial<Habit>) => { setHabits(habits.map((h) => (h.id === id ? { ...h, ...data } : h))); closeModal(); };
  const toggleTask = (taskId: string) => { setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))); };
  const toggleHabit = (habitId: string, date: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id === habitId) {
          const newHistory = { ...h.history };
          const current = newHistory[date] || 'none';
          let next: 'done' | 'failed' | 'none' = 'done';
          if (current === 'done') next = 'failed';
          else if (current === 'failed') next = 'none';
          newHistory[date] = next;
          let streak = 0;
          let currDate = new Date();
          while (true) {
            const dateStr = format(currDate, 'yyyy-MM-dd');
            if (newHistory[dateStr] === 'done') { streak++; currDate = addDays(currDate, -1); }
            else break;
          }
          return { ...h, history: newHistory, streak };
        }
        return h;
      })
    );
  };
  const deleteHabit = (id: string) => setHabits(habits.filter((h) => h.id !== id));
  const deleteTask = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  // --- Priority helpers ---
  const priorityBorderColor: Record<string, string> = {
    low: 'border-l-emerald-400',
    medium: 'border-l-amber-400',
    high: 'border-l-red-400',
    LOW: 'border-l-emerald-400',
    MEDIUM: 'border-l-amber-400',
    HIGH: 'border-l-red-400',
  };
  const priorityBadgeColor: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    LOW: 'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HIGH: 'bg-red-100 text-red-700',
  };

  // --- Streak strip helper ---
  // Returns color class for a day based on all-done / partial / failed / no habits
  const getDayStreakColor = (dateStr: string): string => {
    if (habits.length === 0) return 'bg-gray-200';
    const done = habits.filter((h) => h.history[dateStr] === 'done').length;
    const failed = habits.filter((h) => h.history[dateStr] === 'failed').length;
    const total = habits.length;
    if (done === total) return 'bg-emerald-500';
    if (done > 0 && done >= total / 2) return 'bg-orange-400';
    if (failed > 0 || done > 0) return 'bg-red-400';
    return 'bg-gray-200';
  };

  // Compute best streak for flame card
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

  // --- Views ---

  const DayView = () => {
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
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{format(selectedDate, 'EEEE')}</h2>
            <p className="text-xs text-gray-500 font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-2 hover:bg-white rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold bg-white rounded-xl shadow-sm text-gray-700 hover:shadow transition-all min-h-[44px]"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-white rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* 14-day streak strip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Last 14 Days</p>
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
                  <span className="text-[9px] text-gray-400 font-medium">{item.dayName}</span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      item.isFuture ? 'bg-gray-100 text-gray-300' : color,
                      item.isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : '',
                      isSelected ? 'ring-2 ring-indigo-600 ring-offset-1' : '',
                      item.isFuture ? '' : color === 'bg-gray-200' ? 'text-gray-500' : 'text-white'
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
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 size={16} className={theme.accent} />
                Tasks
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
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
                <p className="text-gray-400 text-center py-10 text-sm italic">No tasks for today</p>
              ) : (
                dayTasks.map((task) => (
                  <motion.div
                    layout
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl border-l-4 transition-all',
                      task.completed
                        ? 'bg-gray-50 border-l-gray-200'
                        : cn('bg-white border border-gray-100 shadow-sm', priorityBorderColor[task.priority])
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
                      <p className={cn('font-semibold text-sm truncate', task.completed && 'line-through text-gray-400')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.startTime && (
                          <span className="text-[10px] text-gray-400 font-medium">
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
                        className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                Habits
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {dayHabits.length}
                </span>
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {dayHabits.length === 0 ? (
                <p className="text-gray-400 text-center py-10 text-sm italic">No habits tracked yet</p>
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
                          : 'bg-white border-gray-100 shadow-sm'
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

  const WeekView = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    const days = eachDayOfInterval({ start, end });
    const [weekSelectedDay, setWeekSelectedDay] = useState(selectedDate);
    const selectedDayTasks = tasks.filter((t) => t.date === format(weekSelectedDay, 'yyyy-MM-dd'));

    return (
      <div className="space-y-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Week of {format(start, 'MMM d')}</h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-2 hover:bg-white rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold bg-white rounded-xl shadow-sm text-gray-700 min-h-[44px]"
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-2 hover:bg-white rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Horizontal scrollable week strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {days.map((day) => {
            const dayTaskCount = tasks.filter((t) => t.date === format(day, 'yyyy-MM-dd')).length;
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
                    ? 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                    : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-300'
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{format(day, 'EEE')}</span>
                <span className="text-2xl font-black leading-tight">{format(day, 'd')}</span>
                {dayTaskCount > 0 ? (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      isSelected ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-600'
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              <p className="text-gray-400 text-center py-10 text-sm italic">No tasks — add one!</p>
            ) : (
              selectedDayTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border-l-4 transition-all',
                    task.completed
                      ? 'bg-gray-50 border-l-gray-200'
                      : cn('bg-white border border-gray-100 shadow-sm', priorityBorderColor[task.priority])
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
                  <span className={cn('flex-1 text-sm font-semibold', task.completed && 'line-through text-gray-400')}>
                    {task.title}
                  </span>
                  {task.startTime && <span className="text-[10px] text-gray-400">{task.startTime}</span>}
                </div>
              ))
            )}
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
      <div className="space-y-4 pb-6">
        {/* iOS-style month header */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{format(selectedDate, 'MMMM')}</h2>
            <p className="text-xs text-gray-400 font-semibold">{format(selectedDate, 'yyyy')}</p>
          </div>
          <button
            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight size={20} className="text-gray-500" />
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const ds = format(day, 'yyyy-MM-dd');
              const dayTasks = tasks.filter((t) => t.date === ds);
              const dayHabitsDone = habits.filter((h) => h.history[ds] === 'done').length;
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
                    isTodayDay ? 'bg-indigo-50' : !allHabitsDone ? 'hover:bg-gray-50' : 'hover:bg-emerald-100'
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
            <span className="text-[10px] text-gray-500 font-medium">Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] text-gray-500 font-medium">Habits done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200"></span>
            <span className="text-[10px] text-gray-500 font-medium">All habits done</span>
          </div>
        </div>
      </div>
    );
  };

  const StatsView = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), -i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const completedCount = habits.reduce(
        (acc, h) => acc + (h.history[dateStr] ? (h.type === 'positive' ? 1 : -1) : 0),
        0
      );
      return { name: format(date, 'EEE'), score: completedCount, date: dateStr };
    }).reverse();

    return (
      <div className="space-y-6 pb-6">
        <h2 className="text-2xl font-bold text-gray-800">Analytics & Progress</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habit Score Chart */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-indigo-500" size={18} /> Habit Performance Score
            </h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-gray-500 italic">Score = (Positive Done) - (Negative Done)</p>
          </div>

          {/* Badges */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} /> Achievements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      'p-4 rounded-2xl border transition-all flex flex-col items-center text-center',
                      isUnlocked ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'
                    )}
                  >
                    <span className="text-3xl mb-2">{badge.icon}</span>
                    <p className="font-bold text-sm text-gray-800">{badge.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">{badge.description}</p>
                    {isUnlocked && (
                      <span className="mt-2 text-[8px] font-bold uppercase text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    )}
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
      <div className="space-y-6 max-w-2xl pb-6">
        <h2 className="text-2xl font-bold text-gray-800">Preferences</h2>

        {/* Stats shortcut on mobile */}
        <button
          onClick={() => setActiveTab('stats')}
          className="lg:hidden w-full flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <BarChart3 size={20} className="text-indigo-500" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-sm">Analytics & Stats</p>
            <p className="text-xs text-gray-500">View your progress charts and badges</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 ml-auto" />
        </button>

        {/* Themes */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold mb-4">Color Theme</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DEFAULT_THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => setTheme(t)}
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all text-left',
                  theme.name === t.name ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <div className={cn('w-8 h-8 rounded-full mb-2', t.primary)}></div>
                <p className="text-sm font-bold text-gray-700">{t.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Background Image */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ImageIcon size={18} /> Background Image
          </h3>
          <div className="space-y-3">
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
                  <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                    Live Preview
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Download size={18} /> Data Management
          </h3>
          <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
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
              Data is saved locally and synced to the database when online.
            </p>
            <button
              onClick={handleManualSync}
              disabled={isSaving}
              className="w-full py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <div className="flex items-center gap-2">
                <Activity size={14} className={isSaving ? 'animate-spin' : ''} />
                {isSaving ? `Syncing ${syncProgress}%` : 'Sync to Database'}
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
          <div className="flex flex-col sm:flex-row gap-3">
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
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Search size={18} /> Database Inspector
            </h3>
            <a
              href={`${API_BASE}/data`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Open API <X size={12} className="rotate-45" />
            </a>
          </div>
          <p className="text-sm text-gray-500 mb-3">Raw JSON stored in the database.</p>
          <div className="bg-gray-900 rounded-2xl p-4 overflow-hidden">
            <pre className="text-[10px] text-emerald-400 font-mono overflow-auto max-h-[200px] scrollbar-hide">
              {JSON.stringify(
                {
                  habits,
                  tasks,
                  theme: { ...theme, background: bgImage },
                  badges: BADGES.filter((b) => unlockedBadges.includes(b.id)),
                },
                null,
                2
              )}
            </pre>
          </div>
        </section>
      </div>
    );
  };

  // --- Modal (slide up on mobile) ---
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
          setPriority((editingItem.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM');
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
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[92dvh] flex flex-col"
        >
          {/* Drag handle (mobile) */}
          <div className="lg:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200"></div>
          </div>
          <div className={cn('px-6 py-4 text-white flex justify-between items-center', theme.primary)}>
            <h3 className="text-lg font-bold">
              {isEditing ? 'Edit' : 'Add New'} {modalType === 'task' ? 'Task' : 'Habit'}
            </h3>
            <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X size={22} />
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title / Name</label>
              <input
                autoFocus
                type="text"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={modalType === 'task' ? 'What needs to be done?' : 'What habit to track?'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {modalType === 'task' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Time</label>
                    <input
                      type="time"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Time</label>
                    <input
                      type="time"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Priority</label>
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border-2 transition-all min-h-[44px]',
                          priority === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-100 text-gray-400'
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
                      'flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 min-h-[44px]',
                      type === 'positive' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-100 text-gray-400'
                    )}
                  >
                    <Check size={18} /> Positive
                  </button>
                  <button
                    onClick={() => setType('negative')}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 min-h-[44px]',
                      type === 'negative' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-100 text-gray-400'
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
              className={cn(
                'w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]',
                theme.primary
              )}
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
      <div className="space-y-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">Weekly Habit Matrix</h2>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors">
              This Week
            </button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  Habit
                </th>
                {days.map((day) => (
                  <th key={day.toString()} className="p-3 text-center border-b border-gray-100 min-w-[48px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{format(day, 'EEE')}</p>
                    <p className={cn('text-sm font-bold', isToday(day) ? 'text-indigo-600' : 'text-gray-700')}>
                      {format(day, 'd')}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', habit.type === 'positive' ? 'bg-emerald-500' : 'bg-red-500')}></div>
                      <span className="font-semibold text-gray-700 text-sm">{habit.name}</span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const status = habit.history[dateStr] || 'none';
                    return (
                      <td key={dateStr} className="p-3 border-b border-l border-gray-50 text-center">
                        <button
                          onClick={() => toggleHabit(habit.id, dateStr)}
                          className={cn(
                            'w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all mx-auto min-h-[44px] min-w-[44px]',
                            status === 'done'
                              ? habit.type === 'positive'
                                ? 'bg-emerald-500 border-transparent'
                                : 'bg-red-500 border-transparent'
                              : status === 'failed'
                              ? 'bg-gray-800 border-transparent'
                              : 'border-gray-100 hover:border-gray-300'
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
                  <td colSpan={8} className="p-10 text-center text-gray-400 italic">
                    No habits tracked. Add some in the Habits tab!
                  </td>
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
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 italic">No habits found. Create your first habit!</p>
            </div>
          ) : (
            habits.map((habit) => (
              <div key={habit.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
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
                <p className="text-xs text-gray-500 mb-4 capitalize">{habit.type} Habit • Daily</p>
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
                              : 'bg-gray-50 border-gray-100'
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
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold text-gray-500 hover:text-indigo-500 bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl transition-colors min-h-[44px]"
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

  // Desktop sidebar NavItem
  function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-2xl transition-all group',
          active ? cn(theme.primary, 'text-white shadow-lg shadow-indigo-100') : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <span className={cn('transition-transform group-hover:scale-110', active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')}>
          {icon}
        </span>
        <span className="font-bold text-sm">{label}</span>
      </button>
    );
  }

  // Mobile bottom nav tabs — 5 tabs, no center FAB slot gap
  const BOTTOM_TABS: { id: typeof activeTab; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={22} />, label: 'Home' },
    { id: 'day',       icon: <Sun size={22} />,             label: 'Today' },
    { id: 'month',     icon: <CalendarIcon size={22} />,    label: 'Calendar' },
    { id: 'habits',    icon: <Flame size={22} />,           label: 'Habits' },
    { id: 'settings',  icon: <Settings size={22} />,        label: 'More' },
  ];

  // FAB action sheet — slides up from bottom
  const FabActionSheet = () => {
    if (!isFabOpen) return null;
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setIsFabOpen(false)} />
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-28 left-4 right-4 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick Add</p>
            </div>
            <button
              onClick={() => { setIsFabOpen(false); setModalType('task'); setIsModalOpen(true); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 min-h-[64px]"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-indigo-600" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-base block">Add Task</span>
                <span className="text-xs text-gray-400">Schedule something for today</span>
              </div>
            </button>
            <button
              onClick={() => { setIsFabOpen(false); setModalType('habit'); setIsModalOpen(true); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[64px]"
            >
              <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Flame size={20} className="text-orange-500" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-base block">Add Habit</span>
                <span className="text-xs text-gray-400">Track a recurring behaviour</span>
              </div>
            </button>
            <div className="px-5 py-3">
              <button
                onClick={() => setIsFabOpen(false)}
                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm min-h-[48px]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </>
    );
  };

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

        {/* ── MOBILE HEADER (hidden on lg+) ── */}
        <header className="lg:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shrink-0 z-40">
          {/* App name */}
          <div className="flex items-center gap-2.5">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md', theme.primary)}>
              ✓
            </div>
            <h1 className="text-base font-black tracking-tight text-gray-900">Track Daily</h1>
          </div>
          {/* Sync status dot */}
          <div className="flex items-center gap-2">
            {isSaving ? (
              <Loader2 size={16} className="text-indigo-400 animate-spin" />
            ) : isOnline ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Synced
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                Offline
              </span>
            )}
          </div>
        </header>

        {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
        <aside className="hidden lg:flex w-64 bg-white/90 backdrop-blur-xl border-r border-white/20 flex-col p-6 shrink-0">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg font-bold text-lg', theme.primary)}>
              ✓
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-black tracking-tighter text-gray-800">HABIT TRACKER</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">Build better habits, one day at a time</p>
            </div>
          </div>

          {/* Sync Status */}
          <div className="mb-6 px-2">
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
                <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${syncProgress}%` }} />
              </div>
            )}
          </div>

          <nav className="flex flex-col space-y-2 w-full flex-1">
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavItem active={activeTab === 'day'}       onClick={() => setActiveTab('day')}       icon={<Sun size={20} />}             label="Day View" />
            <NavItem active={activeTab === 'week'}      onClick={() => setActiveTab('week')}      icon={<CalendarIcon size={20} />}    label="Week View" />
            <NavItem active={activeTab === 'month'}     onClick={() => setActiveTab('month')}     icon={<CalendarIcon size={20} />}    label="Month View" />
            <NavItem active={activeTab === 'grid'}      onClick={() => setActiveTab('grid')}      icon={<Grid size={20} />}            label="Grid Matrix" />
            <NavItem active={activeTab === 'habits'}    onClick={() => setActiveTab('habits')}    icon={<Activity size={20} />}        label="Habits" />
            <div className="h-px bg-gray-100 my-4 mx-2 shrink-0"></div>
            <NavItem active={activeTab === 'stats'}     onClick={() => setActiveTab('stats')}     icon={<BarChart3 size={20} />}       label="Analytics" />
            <NavItem active={activeTab === 'settings'}  onClick={() => setActiveTab('settings')}  icon={<Settings size={20} />}        label="Settings" />
          </nav>

          <div className="mt-auto pt-6 px-2">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Daily Progress</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', theme.primary)}
                  style={{
                    width: `${tasks.length > 0 ? (tasks.filter((t) => t.completed).length / tasks.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-gray-500 mt-2">
                {tasks.filter((t) => t.completed).length}/{tasks.length} Tasks Done
              </p>
            </div>
          </div>
        </aside>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scrollbar-hide pb-28 lg:pb-10">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
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
                    toggleHabit={toggleHabit}
                  />
                )}
                {activeTab === 'day'      && <DayView />}
                {activeTab === 'week'     && <WeekView />}
                {activeTab === 'month'    && <MonthView />}
                {activeTab === 'grid'     && <GridView />}
                {activeTab === 'habits'   && <HabitManagerView />}
                {activeTab === 'stats'    && <StatsView />}
                {activeTab === 'settings' && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV + FAB (hidden on lg+) ── */}
        <div className="lg:hidden">
          {/* FAB action sheet */}
          <FabActionSheet />

          {/* Bottom nav bar */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-end justify-around px-1 pt-2 pb-2">
              {BOTTOM_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center"
                  >
                    <span
                      className={cn(
                        'transition-colors',
                        isActive ? 'text-indigo-600' : 'text-gray-400'
                      )}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold transition-colors',
                        isActive ? 'text-indigo-600' : 'text-gray-400'
                      )}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <span className="w-4 h-0.5 rounded-full bg-indigo-500 mt-0.5"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* ── MODAL ── */}
        <AnimatePresence>
          {isModalOpen && <Modal />}
        </AnimatePresence>
      </div>
    </div>
  );
}
