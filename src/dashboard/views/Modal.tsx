import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';
import { HabitType } from '../../types';

export const Modal = () => {
  const { 
    isModalOpen, setIsModalOpen, modalType, editingItem, selectedDate, theme, 
    addTask, updateTask, addHabit, updateHabit 
  } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<HabitType>('positive');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const isEditing = editingItem !== null;

  const closeModal = () => setIsModalOpen(false);

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
              closeModal();
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