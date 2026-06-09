import { Badge, AppTheme } from './types';

export const DEFAULT_THEMES: AppTheme[] = [
  {
    name: 'Classic Indigo',
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-100',
    accent: 'text-indigo-600',
  },
  {
    name: 'Soft Pink',
    primary: 'bg-pink-500',
    secondary: 'bg-pink-100',
    accent: 'text-pink-500',
  },
  {
    name: 'Ocean Blue',
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    accent: 'text-blue-600',
  },
  {
    name: 'Emerald Green',
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-100',
    accent: 'text-emerald-600',
  },
  {
    name: 'Midnight Dark',
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    accent: 'text-slate-400',
  },
];

export const BADGES: Badge[] = [
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Keep it up for 3 days!',
    icon: '🔥',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7-day streak achieved!',
    icon: '🏆',
  },
  {
    id: 'habit-master',
    name: 'Habit Master',
    description: 'Complete 5 habits in one day.',
    icon: '🌟',
  },
  {
    id: 'planner-pro',
    name: 'Planner Pro',
    description: 'Schedule 10 tasks in a week.',
    icon: '📅',
  },
];

export const priorityBorderColor: Record<string, string> = {
  High: 'border-l-red-500',
  Medium: 'border-l-amber-500',
  Low: 'border-l-emerald-500',
};

export const priorityBadgeColor: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-emerald-100 text-emerald-700',
};
