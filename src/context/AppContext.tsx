import React, { createContext, useContext } from 'react';
import { Task, Habit, AppTheme, User } from '../types';

export const AppContext = createContext<any>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
