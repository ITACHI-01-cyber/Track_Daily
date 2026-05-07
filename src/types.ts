/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HabitType = 'positive' | 'negative';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  frequency: 'daily' | 'weekly';
  streak: number;
  history: { [date: string]: 'done' | 'failed' | 'none' }; // date string (YYYY-MM-DD) -> status
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface AppTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background?: string; // Custom image URL
}

export interface AppData {
  habits: Habit[];
  tasks: Task[];
  theme: AppTheme;
  badges: Badge[];
  lastUpdated?: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}
