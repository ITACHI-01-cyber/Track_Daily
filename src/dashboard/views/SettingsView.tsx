import React, { useRef } from 'react';
import { BarChart3, ChevronRight, Upload, ImageIcon, Download, Wifi, WifiOff, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../utils';
import { DEFAULT_THEMES } from '../../constants';

export const SettingsView = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    currentUser, setCurrentUser, setActiveTab, theme, setTheme, 
    bgImage, setBgImage, isOnline, isSaving, syncProgress, 
    handleManualSync, exportData, importData 
  } = useAppContext();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let { width, height } = img;
          if (width > height && width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            setCurrentUser({ ...currentUser, avatarUrl: base64 });
            try {
              localStorage.setItem(`avatar_${currentUser.email}`, base64);
            } catch (err) {
              console.error('Failed to save avatar:', err);
            }
          }
        };
        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl pb-6">
      <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Preferences</h2>

      {/* Stats shortcut on mobile */}
      <button
        onClick={() => setActiveTab('stats')}
        className="lg:hidden w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors"
        style={{ background: '#F5F1EA', borderColor: '#2B2B2B' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8622A18' }}>
          <BarChart3 size={20} style={{ color: '#E8622A' }} />
        </div>
        <div className="text-left">
          <p className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Analytics & Stats</p>
          <p className="text-xs" style={{ color: '#6B6560' }}>View your progress charts and badges</p>
        </div>
        <ChevronRight size={16} style={{ color: '#9E9890' }} className="ml-auto" />
      </button>

      {/* Profile / Account Settings */}
      <section className="p-5 rounded-2xl border" style={{ background: '#F5F1EA', borderColor: '#2B2B2B' }}>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div 
            className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border cursor-pointer relative group" 
            style={{ borderColor: '#2B2B2B' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Upload size={16} className="text-white" />
            </div>
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.firstName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xl" style={{ background: '#F3E8FF', color: '#1A1A1A' }}>
                {currentUser?.firstName?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold" style={{ color: '#1A1A1A' }}>
              {currentUser?.firstName} {currentUser?.lastName}
            </h3>
            <p className="text-sm" style={{ color: '#6B6560' }}>
              {currentUser?.email}
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentUser(null);
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-colors mt-4 sm:mt-0 w-full sm:w-auto"
            style={{ background: '#E8622A', boxShadow: '0 4px 14px rgba(232,98,42,0.3)' }}
          >
            Log Out
          </button>
        </div>
      </section>

      {/* Themes */}
      <section className="p-5 rounded-2xl border" style={{ background: '#F5F1EA', borderColor: '#2B2B2B' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Color Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DEFAULT_THEMES.map((t) => (
            <button
              key={t.name}
              onClick={() => setTheme(t)}
              className="p-4 rounded-xl border-2 transition-all text-left"
              style={{
                background: '#EDE8DF',
                borderColor: theme.name === t.name ? '#E8622A' : '#D4CEC4',
                boxShadow: theme.name === t.name ? '0 0 0 3px rgba(232,98,42,0.15)' : 'none',
              }}
            >
              <div className={cn('w-8 h-8 rounded-full mb-2', t.primary)}></div>
              <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{t.name}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Background Image */}
      <section className="p-5 rounded-2xl border" style={{ background: '#F5F1EA', borderColor: '#2B2B2B' }}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
          <ImageIcon size={18} style={{ color: '#6B6560' }} /> Background Image
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste image URL here..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
              style={{ background: '#EDE8DF', borderColor: '#2B2B2B', color: '#1A1A1A' }}
              value={bgImage}
              onChange={(e) => setBgImage(e.target.value)}
            />
            <button
              onClick={() => setBgImage('')}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{ background: '#EDE8DF', borderColor: '#2B2B2B', color: '#6B6560' }}
            >
              Clear
            </button>
          </div>
          {bgImage && (
            <div className="relative aspect-video rounded-xl overflow-hidden border" style={{ borderColor: '#2B2B2B' }}>
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
      <section className="p-5 rounded-2xl border" style={{ background: '#F5F1EA', borderColor: '#2B2B2B' }}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
          <Download size={18} style={{ color: '#6B6560' }} /> Data Management
        </h3>
        <div className="mb-5 p-4 rounded-xl border" style={{ background: '#EDE8DF', borderColor: '#D4CEC4' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Sync Status</span>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ color: '#16a34a', background: '#dcfce7' }}>
                  <Wifi size={12} /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ color: '#ea580c', background: '#ffedd5' }}>
                  <WifiOff size={12} /> Offline
                </span>
              )}
            </div>
          </div>
          <p className="text-xs mb-3" style={{ color: '#6B6560' }}>
            Data is saved locally and synced to the database when online.
          </p>
          <button
            onClick={handleManualSync}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl text-xs font-bold border transition-colors flex flex-col items-center justify-center gap-2"
            style={{ background: '#F5F1EA', borderColor: '#2B2B2B', color: '#1A1A1A' }}
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className={isSaving ? 'animate-spin' : ''} />
              {isSaving ? `Syncing ${syncProgress}%` : 'Sync to Database'}
            </div>
            {isSaving && (
              <div className="w-1/2 h-1 rounded-full overflow-hidden" style={{ background: '#D4CEC4' }}>
                <motion.div
                  className="h-full"
                  style={{ background: '#E8622A' }}
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-colors"
            style={{ background: '#E8622A', boxShadow: '0 4px 14px rgba(232,98,42,0.3)' }}
          >
            <Download size={18} /> Export JSON
          </button>
          <label
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border cursor-pointer transition-colors"
            style={{ background: '#EDE8DF', borderColor: '#2B2B2B', color: '#1A1A1A' }}
          >
            <Upload size={18} /> Import JSON
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
        </div>
      </section>
    </div>
  );
};
