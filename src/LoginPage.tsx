import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Flame, Loader2 } from 'lucide-react';
import { cn } from './utils';

const API_BASE =
  window.location.hostname === 'localhost'
    ? '/api'
    : 'https://track-daily.onrender.com/api';

// ─── Theme tokens ───────────────────────────────────────────────
// Off-white matte palette inspired by the reference image
const T = {
  bg:         '#EDE8DF',   // warm off-white page background
  card:       '#F5F1EA',   // slightly lighter card surface
  cardBorder: '#2B2B2B',   // dark navy/charcoal border
  panelBg:    '#F0EBE2',   // left panel warm tint
  inputBg:    '#F5F1EA',   // input field background
  inputBorder:'#2B2B2B',   // input border
  accent:     '#E8622A',   // orange CTA (same energy as reference)
  accentHover:'#D4541E',
  text:       '#1A1A1A',   // near-black heading
  textMuted:  '#6B6560',   // warm mid-gray
  textLight:  '#9E9890',   // light label gray
  divider:    '#D4CEC4',   // subtle warm divider
};

const SLIDES = [
  {
    emoji: '🔥',
    label: 'Streak Tracking',
    title: 'Build Unstoppable Habits',
    description: 'Track every day and watch your consistency compound into real results over time.',
  },
  {
    emoji: '✅',
    label: 'Task Planning',
    title: 'Plan Your Perfect Day',
    description: 'Schedule tasks with priorities and time slots. Stay focused, stay in flow.',
  },
  {
    emoji: '🤖',
    label: 'AI Coach',
    title: 'Your AI Productivity Coach',
    description: 'A personal AI agent that reads your data and gives you actionable advice.',
  },
  {
    emoji: '📊',
    label: 'Analytics',
    title: 'Insights That Actually Matter',
    description: 'Charts, streaks, and badges that show exactly how far you have come.',
  },
];

interface LoginPageProps {
  onLogin: (user: {
    id: string; email: string; username: string;
    firstName: string; lastName: string; avatarUrl: string;
  }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setSlideIndex((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[slideIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, username, firstName, lastName: '' };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data === 'string' ? data : data?.message || 'Something went wrong');
        return;
      }
      onLogin({
        id: data.id || data._id || 'default',
        email: data.email || email,
        username: data.username || username || email.split('@')[0],
        firstName: data.firstName || firstName || '',
        lastName: data.lastName || '',
        avatarUrl: data.avatarUrl || '',
      });
    } catch {
      onLogin({
        id: 'offline-' + Date.now(),
        email: email || 'user@local',
        username: username || email.split('@')[0] || 'user',
        firstName: firstName || 'User',
        lastName: '',
        avatarUrl: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    onLogin({ id: 'default', email: 'guest@local', username: 'guest', firstName: 'Guest', lastName: '', avatarUrl: '' });
  };

  // ─── Shared input class ───────────────────────────────────────
  const inputCls = `w-full px-4 py-3 rounded-lg text-sm border transition-all outline-none
    placeholder-[${T.textLight}] text-[${T.text}]
    bg-[${T.inputBg}] border-[${T.inputBorder}]
    focus:border-[${T.accent}] focus:ring-2 focus:ring-[${T.accent}]/15`;

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row items-stretch font-sans"
      style={{ background: T.bg, minHeight: '100dvh' }}
    >

      {/* ══════════════════════════════════════════════════════
          MOBILE TOP STRIP  (hidden lg+)
      ══════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden flex flex-col gap-5 px-5 pt-8 pb-6 shrink-0"
        style={{ background: T.panelBg, borderBottom: `1.5px solid ${T.cardBorder}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: T.accent }}
          >
            <Flame size={17} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: T.text }}>
            Track Daily
          </span>
        </div>

        {/* Animated feature pill */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 border"
            style={{ background: T.card, borderColor: T.cardBorder }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `${T.accent}18`, border: `1px solid ${T.accent}40` }}
            >
              {slide.emoji}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: T.text }}>{slide.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: T.textMuted }}>{slide.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className={cn('rounded-full h-1.5 transition-all duration-300', i === slideIndex ? 'w-6' : 'w-1.5')}
              style={{ background: i === slideIndex ? T.accent : T.divider }}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LEFT PANEL  (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col items-center justify-center relative overflow-hidden select-none p-12 xl:p-16"
        style={{ background: T.panelBg, borderRight: `1.5px solid ${T.cardBorder}` }}
      >
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(${T.text} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo top-left */}
        <div className="absolute top-8 left-10 flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ background: T.accent }}>
            <Flame size={17} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: T.text }}>Track Daily</span>
        </div>

        {/* Feature card — mimics the illustration card in the reference */}
        <div
          className="relative z-10 w-full max-w-md rounded-2xl border overflow-hidden"
          style={{ background: T.card, borderColor: T.cardBorder }}
        >
          {/* Illustration area */}
          <div
            className="w-full flex items-center justify-center py-14 px-10"
            style={{ background: T.bg, borderBottom: `1px solid ${T.cardBorder}` }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex + '-icon'}
                initial={{ opacity: 0, scale: 0.75, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -12 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Big emoji illustration */}
                <div
                  className="w-32 h-32 rounded-2xl flex items-center justify-center text-6xl shadow-lg"
                  style={{ background: T.card, border: `1.5px solid ${T.cardBorder}` }}
                >
                  {slide.emoji}
                </div>
                {/* Label badge */}
                <span
                  className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}30` }}
                >
                  {slide.label}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text below illustration */}
          <div className="px-8 py-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex + '-text'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-center mb-2" style={{ color: T.text }}>
                  {slide.title}
                </h2>
                <p className="text-sm text-center leading-relaxed" style={{ color: T.textMuted }}>
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slide dots */}
            <div className="flex justify-center gap-2 mt-6">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className="rounded-full h-2 transition-all duration-300"
                  style={{
                    width: i === slideIndex ? 24 : 8,
                    background: i === slideIndex ? T.accent : T.divider,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature tags at bottom */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center gap-3 flex-wrap px-10">
          {[{ icon: '🔒', label: 'Secure sync' }, { icon: '📱', label: 'Mobile-first' }, { icon: '⚡', label: 'AI-powered' }].map(b => (
            <div
              key={b.label}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border"
              style={{ background: T.card, borderColor: T.cardBorder, color: T.textMuted }}
            >
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FORM PANEL  (right on desktop, below on mobile)
      ══════════════════════════════════════════════════════ */}
      <div
        className="flex-1 lg:w-[48%] xl:w-[45%] flex flex-col justify-center overflow-y-auto"
        style={{ background: T.card }}
      >
        <div className="w-full max-w-sm mx-auto px-6 py-10 lg:py-0 lg:px-10 xl:px-14">

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + '-heading'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold mb-1" style={{ color: T.text }}>
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-sm mb-7" style={{ color: T.textMuted }}>
                {mode === 'login'
                  ? 'Sign in to continue your streak'
                  : 'One account for all your habits and tasks'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* ── Mode switcher tabs ── */}
          <div
            className="flex rounded-xl p-1 mb-7 border"
            style={{ background: T.bg, borderColor: T.cardBorder }}
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 touch-manipulation"
                style={
                  mode === m
                    ? { background: T.card, color: T.text, boxShadow: `0 1px 4px rgba(0,0,0,0.10)`, border: `1px solid ${T.cardBorder}` }
                    : { color: T.textMuted }
                }
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── Form ── */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="space-y-3.5"
            >
              {/* Signup extras */}
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textLight }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className={inputCls}
                      style={{ background: T.inputBg, borderColor: T.inputBorder, color: T.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textLight }}>
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      placeholder="alex99"
                      className={inputCls}
                      style={{ background: T.inputBg, borderColor: T.inputBorder, color: T.text }}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textLight }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className={inputCls}
                  style={{ background: T.inputBg, borderColor: T.inputBorder, color: T.text }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textLight }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className={inputCls + ' pr-11'}
                    style={{ background: T.inputBg, borderColor: T.inputBorder, color: T.text }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 transition-colors touch-manipulation"
                    style={{ color: T.textLight }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      className="text-xs underline underline-offset-2 transition-colors touch-manipulation"
                      style={{ color: T.textMuted }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="rounded-lg px-4 py-3 text-xs border"
                      style={{ background: '#FEF2F0', borderColor: '#E8622A40', color: '#C0411A' }}
                    >
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── CTA button — orange like reference ── */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2 touch-manipulation mt-1"
                style={{
                  background: T.accent,
                  boxShadow: `0 4px 16px ${T.accent}40`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = T.accentHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.accent)}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                ) : (
                  mode === 'login' ? 'Continue →' : 'Create Account →'
                )}
              </button>

            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: T.divider }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.textLight }}>or</span>
            <div className="flex-1 h-px" style={{ background: T.divider }} />
          </div>

          {/* Guest */}
          <button
            onClick={handleGuest}
            className="w-full py-3 rounded-xl text-sm font-medium border transition-all active:scale-[0.97] touch-manipulation"
            style={{ background: T.bg, borderColor: T.cardBorder, color: T.textMuted }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; }}
          >
            Continue as Guest
          </button>

          {/* Footer */}
          <p className="text-[10px] text-center mt-6 leading-relaxed" style={{ color: T.textLight }}>
            By continuing you agree to our{' '}
            <span
              className="underline underline-offset-2 cursor-pointer transition-colors"
              style={{ color: T.textMuted }}
            >
              Terms of Service
            </span>
            {' '}and{' '}
            <span
              className="underline underline-offset-2 cursor-pointer transition-colors"
              style={{ color: T.textMuted }}
            >
              Privacy Policy
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}
