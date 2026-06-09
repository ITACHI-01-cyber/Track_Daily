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
import { AppContext } from './context/AppContext';
import { DayView } from './dashboard/views/DayView';
import { WeekView } from './dashboard/views/WeekView';
import { MonthView } from './dashboard/views/MonthView';
import { StatsView } from './dashboard/views/StatsView';
import { SettingsView } from './dashboard/views/SettingsView';
import { GridView } from './dashboard/views/GridView';
import { HabitManagerView } from './dashboard/views/HabitManagerView';
import { Modal } from './dashboard/views/Modal';
import { LoginPage } from './LoginPage';

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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('track_daily_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('track_daily_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('track_daily_user');
      }
    } catch (err) {
      console.error('Failed to save user session:', err);
    }
  }, [currentUser]);
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
    if (!currentUser) return; // wait for login
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
  }, [currentUser, retryCount]);

  const saveDataToServer = async (data: AppData) => {
    if (!currentUser) return;
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


  // Desktop sidebar NavItem
  function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-2xl transition-all group',
          active ? cn(theme.primary, 'text-white shadow-lg shadow-indigo-100') : 'text-text-muted hover:bg-page-bg hover:text-text-main'
        )}
      >
        <span className={cn('transition-transform group-hover:scale-110', active ? 'text-white' : 'text-text-muted group-hover:text-text-muted')}>
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
            className="fixed bottom-28 left-4 right-4 z-50 bg-card-surface rounded-3xl shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
          >
            <div className="px-5 py-4 border-b border-border-strong">
              <p className="text-xs font-black text-text-muted uppercase tracking-widest">Quick Add</p>
            </div>
            <button
              onClick={() => { setIsFabOpen(false); setModalType('task'); setIsModalOpen(true); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-page-bg active:bg-panel-bg transition-colors border-b border-gray-50 min-h-[64px]"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-indigo-600" />
              </div>
              <div>
                <span className="font-bold text-text-main text-base block">Add Task</span>
                <span className="text-xs text-text-muted">Schedule something for today</span>
              </div>
            </button>
            <button
              onClick={() => { setIsFabOpen(false); setModalType('habit'); setIsModalOpen(true); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-page-bg active:bg-panel-bg transition-colors min-h-[64px]"
            >
              <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Flame size={20} className="text-orange-500" />
              </div>
              <div>
                <span className="font-bold text-text-main text-base block">Add Habit</span>
                <span className="text-xs text-text-muted">Track a recurring behaviour</span>
              </div>
            </button>
            <div className="px-5 py-3">
              <button
                onClick={() => setIsFabOpen(false)}
                className="w-full py-3 rounded-2xl bg-panel-bg text-text-muted font-bold text-sm min-h-[48px]"
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
  // Show login page until user authenticates
  if (!currentUser) {
    return <LoginPage onLogin={(user) => {
      const savedAvatar = localStorage.getItem(`avatar_${user.email}`);
      if (savedAvatar) {
        user.avatarUrl = savedAvatar;
      }
      setCurrentUser(user);
    }} />;
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      activeTab, setActiveTab,
      selectedDate, setSelectedDate,
      habits, setHabits,
      tasks, setTasks,
      theme, setTheme,
      unlockedBadges, setUnlockedBadges,
      bgImage, setBgImage,
      isModalOpen, setIsModalOpen,
      modalType, setModalType,
      editingItem, setEditingItem,
      isMobileMenuOpen, setIsMobileMenuOpen,
      isSaving, setIsSaving,
      isOnline, setIsOnline,
      hasPendingChanges, setHasPendingChanges,
      syncProgress, setSyncProgress,
      retryCount, setRetryCount,
      chatMessages, setChatMessages,
      chatInput, setChatInput,
      isChatLoading, setIsChatLoading,
      isFabOpen, setIsFabOpen,
      saveDataToServer, handleManualSync, exportData, importData,
      addTask, addHabit, updateTask, updateHabit,
      toggleTask, deleteTask, toggleHabit, deleteHabit,
      getDayStreakColor, maxStreak
    }}>
      <div className="min-h-screen font-sans text-text-main bg-page-bg relative overflow-hidden">
      {/* Background Image Layer */}
      {bgImage && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-card-surface/40 backdrop-blur-[2px]"></div>
        </div>
      )}

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row h-[100dvh] overflow-hidden">

        {/* ── MOBILE HEADER (hidden on lg+) ── */}
        <header className="lg:hidden flex items-center justify-between bg-card-surface border-b border-border-strong px-4 py-3 shrink-0 z-40">
          {/* App name */}
          <div className="flex items-center gap-2.5">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md', theme.primary)}>
              ✓
            </div>
            <h1 className="text-base font-black tracking-tight text-text-main">Track Daily</h1>
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
        <aside className="hidden lg:flex w-64 bg-panel-bg border-r border-border-strong flex-col p-6 shrink-0">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg font-bold text-lg', theme.primary)}>
              ✓
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-black tracking-tighter text-text-main">HABIT TRACKER</h1>
              <p className="text-[10px] text-text-muted mt-0.5">Build better habits, one day at a time</p>
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
              <div className="w-full h-1 bg-panel-bg rounded-full overflow-hidden mt-2">
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
            <div className="h-px bg-panel-bg my-4 mx-2 shrink-0"></div>
            <NavItem active={activeTab === 'stats'}     onClick={() => setActiveTab('stats')}     icon={<BarChart3 size={20} />}       label="Analytics" />
            <NavItem active={activeTab === 'settings'}  onClick={() => setActiveTab('settings')}  icon={<Settings size={20} />}        label="Settings" />
          </nav>

          <div className="mt-auto pt-6 px-2">
            <div className="bg-card-surface rounded-2xl p-4 border border-border-strong">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-2">Daily Progress</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', theme.primary)}
                  style={{
                    width: `${tasks.length > 0 ? (tasks.filter((t) => t.completed).length / tasks.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-text-muted mt-2">
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
            className="fixed bottom-0 left-0 right-0 z-40 bg-card-surface border-t border-border-strong"
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
                        isActive ? 'text-cta-btn' : 'text-text-muted'
                      )}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold transition-colors',
                        isActive ? 'text-cta-btn' : 'text-text-muted'
                      )}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <span className="w-4 h-0.5 rounded-full bg-cta-btn mt-0.5"></span>
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
    </AppContext.Provider>
  );
}
