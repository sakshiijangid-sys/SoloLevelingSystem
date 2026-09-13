import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  AlarmClock, 
  Check, 
  Trash2, 
  Sparkles, 
  Sun, 
  Moon, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

export interface AnalogClockPickerProps {
  isOpen: boolean;
  initialTime: string | null; // "HH:mm" (24-hour format) e.g., "14:30"
  taskTitle?: string;
  onSave: (time: string | null) => void;
  onClose: () => void;
}

export default function AnalogClockPicker({
  isOpen,
  initialTime,
  taskTitle,
  onSave,
  onClose,
}: AnalogClockPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Internal time state
  const [hour, setHour] = useState<number>(9); // 1-12
  const [minute, setMinute] = useState<number>(0); // 0-59
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const clockRef = useRef<HTMLDivElement>(null);

  // Initialize time state from prop
  useEffect(() => {
    if (!isOpen) return;

    if (initialTime && initialTime.includes(':')) {
      const [hStr, mStr] = initialTime.split(':');
      const rawH = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);

      const p: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
      let h12 = rawH % 12;
      if (h12 === 0) h12 = 12;

      setHour(h12);
      setMinute(isNaN(m) ? 0 : Math.min(59, Math.max(0, m)));
      setPeriod(p);
    } else {
      // Default to current time rounded to next 5 minutes
      const now = new Date();
      const rawH = now.getHours();
      const p: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
      let h12 = rawH % 12;
      if (h12 === 0) h12 = 12;

      const roundedM = Math.round(now.getMinutes() / 5) * 5 % 60;
      setHour(h12);
      setMinute(roundedM);
      setPeriod(p);
    }
    setMode('hours');
  }, [isOpen, initialTime]);

  // Convert 12h + AM/PM back to "HH:mm" (24-hour)
  const get24HourString = useCallback(() => {
    let h24 = hour;
    if (period === 'PM') {
      h24 = hour === 12 ? 12 : hour + 12;
    } else {
      h24 = hour === 12 ? 0 : hour;
    }
    return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }, [hour, minute, period]);

  // Handle pointer calculation on clock face
  const handlePointerCalculation = useCallback((clientX: number, clientY: number, isFinalClick = false) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    // Angle in degrees from 12 o'clock position (0 to 360)
    const rad = Math.atan2(dy, dx);
    const deg = (rad * (180 / Math.PI) + 90 + 360) % 360;

    if (mode === 'hours') {
      let selectedH = Math.round(deg / 30) % 12;
      if (selectedH === 0) selectedH = 12;
      setHour(selectedH);

      // Auto-advance to minutes mode on click
      if (isFinalClick) {
        setTimeout(() => setMode('minutes'), 180);
      }
    } else {
      const selectedM = Math.round(deg / 6) % 60;
      setMinute(selectedM);
    }
  }, [mode]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerCalculation(e.clientX, e.clientY, false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handlePointerCalculation(e.clientX, e.clientY, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
    handlePointerCalculation(e.clientX, e.clientY, true);
  };

  const handleSave = () => {
    onSave(get24HourString());
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  // Quick Presets
  const applyPreset = (h: number, m: number, p: 'AM' | 'PM') => {
    setHour(h);
    setMinute(m);
    setPeriod(p);
  };

  const applyCurrentTime = () => {
    const now = new Date();
    const rawH = now.getHours();
    const p: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
    let h12 = rawH % 12;
    if (h12 === 0) h12 = 12;
    setHour(h12);
    setMinute(now.getMinutes());
    setPeriod(p);
  };

  // Degrees for current hand angle
  const hourAngle = (hour % 12) * 30 + (mode === 'hours' ? 0 : (minute / 60) * 30);
  const minuteAngle = minute * 6;
  const currentHandAngle = mode === 'hours' ? (hour % 12) * 30 : minuteAngle;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className={cn(
            "relative w-full max-w-[360px] sm:max-w-[400px] rounded-3xl p-5 sm:p-6 overflow-hidden z-10 transition-colors shadow-2xl",
            "border",
            isDark 
              ? "bg-zinc-950/95 border-purple-500/40 text-white shadow-[0_0_50px_rgba(168,85,247,0.25)]" 
              : "bg-white border-gray-200 text-gray-900 shadow-2xl"
          )}
        >
          {/* Asymmetric Header Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-purple-400 to-indigo-500" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border transition-colors",
                isDark 
                  ? "bg-purple-900/40 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]" 
                  : "bg-purple-100 border-purple-200 text-purple-700"
              )}>
                <AlarmClock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span>Alarm Clock Timer</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-sans font-bold",
                    isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-800"
                  )}>
                    {isDark ? 'Cyber Dark' : 'Modern Light'}
                  </span>
                </h3>
                {taskTitle && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[200px] font-medium mt-0.5">
                    {taskTitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-xl border transition-colors",
                isDark 
                  ? "border-white/10 hover:border-purple-500/50 hover:bg-white/5 text-gray-400 hover:text-white" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-500 hover:text-gray-800"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Digital Time Display & AM/PM Switcher */}
          <div className={cn(
            "rounded-2xl p-3.5 mb-5 flex items-center justify-between border transition-colors",
            isDark 
              ? "bg-black/50 border-purple-500/20 shadow-inner" 
              : "bg-gray-50 border-gray-200 shadow-sm"
          )}>
            {/* Hour : Minute Toggle Displays */}
            <div className="flex items-center gap-1 font-mono">
              {/* Hour Button */}
              <button
                type="button"
                onClick={() => setMode('hours')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-2xl sm:text-3xl font-black transition-all",
                  mode === 'hours'
                    ? isDark 
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)] scale-105" 
                      : "bg-purple-600 text-white shadow-md scale-105"
                    : isDark 
                      ? "text-gray-400 hover:text-white hover:bg-white/5" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                )}
              >
                {String(hour).padStart(2, '0')}
              </button>

              <span className="text-xl sm:text-2xl font-black text-purple-500 dark:text-purple-400 mx-0.5 animate-pulse">:</span>

              {/* Minute Button */}
              <button
                type="button"
                onClick={() => setMode('minutes')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-2xl sm:text-3xl font-black transition-all",
                  mode === 'minutes'
                    ? isDark 
                      ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.7)] scale-105 font-black" 
                      : "bg-purple-600 text-white shadow-md scale-105"
                    : isDark 
                      ? "text-gray-400 hover:text-white hover:bg-white/5" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                )}
              >
                {String(minute).padStart(2, '0')}
              </button>

              <span className="text-[10px] font-sans font-bold text-gray-400 ml-1.5 uppercase tracking-widest hidden sm:inline">
                {mode === 'hours' ? 'Select Hour' : 'Select Min'}
              </span>
            </div>

            {/* AM / PM Segmented Control */}
            <div className={cn(
              "flex flex-col gap-1 p-1 rounded-xl border text-xs font-bold font-mono",
              isDark ? "bg-zinc-900 border-purple-500/30" : "bg-white border-gray-200 shadow-sm"
            )}>
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all text-center",
                  period === 'AM'
                    ? isDark 
                      ? "bg-purple-600 text-white shadow-sm" 
                      : "bg-purple-600 text-white shadow-sm"
                    : isDark 
                      ? "text-gray-400 hover:text-white" 
                      : "text-gray-600 hover:text-gray-900"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all text-center",
                  period === 'PM'
                    ? isDark 
                      ? "bg-purple-600 text-white shadow-sm" 
                      : "bg-purple-600 text-white shadow-sm"
                    : isDark 
                      ? "text-gray-400 hover:text-white" 
                      : "text-gray-600 hover:text-gray-900"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Analog Clock Dial View */}
          <div className="flex flex-col items-center justify-center my-2">
            <div 
              ref={clockRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={cn(
                "relative w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] rounded-full select-none cursor-pointer touch-none transition-all",
                "flex items-center justify-center",
                isDark 
                  ? "bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-4 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.25)]" 
                  : "bg-gradient-to-b from-slate-50 via-white to-slate-100 border-4 border-slate-200 shadow-xl"
              )}
            >
              {/* Outer Perimeter Hour Ticks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const isHourTick = i % 5 === 0;
                const angle = i * 6;
                return (
                  <div
                    key={i}
                    style={{
                      transform: `rotate(${angle}deg) translateY(-${114}px)`,
                    }}
                    className={cn(
                      "absolute w-0.5 rounded-full transition-colors origin-bottom",
                      isHourTick 
                        ? (isDark ? "h-2.5 bg-purple-400/70" : "h-2.5 bg-purple-600/70") 
                        : (isDark ? "h-1 bg-white/10" : "h-1 bg-gray-300")
                    )}
                  />
                );
              })}

              {/* Numbers on the Clock Face */}
              {mode === 'hours' ? (
                // 1 to 12 Hours
                [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
                  const angle = (h % 12) * 30;
                  const rad = (angle - 90) * (Math.PI / 180);
                  const radius = 86;
                  const x = radius * Math.cos(rad);
                  const y = radius * Math.sin(rad);
                  const isSelected = hour === h;

                  return (
                    <div
                      key={`hour-${h}`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={cn(
                        "absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all",
                        isSelected
                          ? isDark 
                            ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.9)] scale-110 font-black z-20" 
                            : "bg-purple-600 text-white shadow-md scale-110 font-black z-20"
                          : isDark 
                            ? "text-zinc-300 hover:text-white" 
                            : "text-slate-700 hover:text-purple-700 font-semibold"
                      )}
                    >
                      {h}
                    </div>
                  );
                })
              ) : (
                // 00, 05, 10 ... 55 Minutes
                [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                  const angle = m * 6;
                  const rad = (angle - 90) * (Math.PI / 180);
                  const radius = 86;
                  const x = radius * Math.cos(rad);
                  const y = radius * Math.sin(rad);
                  const isSelected = Math.abs(minute - m) <= 2;

                  return (
                    <div
                      key={`minute-${m}`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={cn(
                        "absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-[10px] sm:text-xs transition-all",
                        isSelected
                          ? isDark 
                            ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.9)] scale-110 font-black z-20" 
                            : "bg-purple-600 text-white shadow-md scale-110 font-black z-20"
                          : isDark 
                            ? "text-zinc-400 hover:text-cyan-300" 
                            : "text-slate-600 hover:text-purple-700 font-medium"
                      )}
                    >
                      {String(m).padStart(2, '0')}
                    </div>
                  );
                })
              )}

              {/* Rotating Pointer Hand */}
              <div
                style={{
                  transform: `rotate(${currentHandAngle}deg)`,
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out"
              >
                {/* Hand Stem */}
                <div 
                  className={cn(
                    "w-1 rounded-full origin-bottom mb-[86px]",
                    mode === 'hours'
                      ? (isDark ? "h-[74px] bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]" : "h-[74px] bg-purple-700")
                      : (isDark ? "h-[86px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" : "h-[86px] bg-purple-600")
                  )} 
                />

                {/* Hand Target Circle Tip */}
                <div 
                  style={{
                    transform: `translateY(-${mode === 'hours' ? 86 : 86}px)`
                  }}
                  className={cn(
                    "absolute w-8 h-8 rounded-full border-2 transition-all opacity-40",
                    mode === 'hours'
                      ? (isDark ? "border-purple-400 bg-purple-500/20" : "border-purple-600 bg-purple-600/10")
                      : (isDark ? "border-cyan-300 bg-cyan-400/20" : "border-purple-500 bg-purple-500/10")
                  )}
                />
              </div>

              {/* Center Pivot Pin */}
              <div className={cn(
                "relative z-20 w-4 h-4 rounded-full border-2 shadow-sm flex items-center justify-center",
                isDark 
                  ? "bg-purple-600 border-white text-white shadow-[0_0_10px_rgba(168,85,247,0.9)]" 
                  : "bg-purple-700 border-white text-white"
              )}>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* Mode Tabs: Hours / Minutes */}
          <div className="flex items-center justify-center gap-2 my-3">
            <button
              type="button"
              onClick={() => setMode('hours')}
              className={cn(
                "text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
                mode === 'hours'
                  ? isDark 
                    ? "bg-purple-600/30 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                    : "bg-purple-100 border-purple-300 text-purple-800"
                  : isDark 
                    ? "border-white/10 text-gray-500 hover:text-gray-300" 
                    : "border-gray-200 text-gray-500 hover:text-gray-800"
              )}
            >
              1. Hour (1-12)
            </button>
            <button
              type="button"
              onClick={() => setMode('minutes')}
              className={cn(
                "text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all",
                mode === 'minutes'
                  ? isDark 
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
                    : "bg-purple-100 border-purple-300 text-purple-800"
                  : isDark 
                    ? "border-white/10 text-gray-500 hover:text-gray-300" 
                    : "border-gray-200 text-gray-500 hover:text-gray-800"
              )}
            >
              2. Minute (00-59)
            </button>
          </div>

          {/* Quick Presets Chips */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-widest font-mono text-gray-400 dark:text-gray-500 font-bold">
                Quick Presets
              </span>
              <button
                type="button"
                onClick={applyCurrentTime}
                className="text-[9px] font-mono text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Current Time
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
              {[
                { label: '08:00 AM', h: 8, m: 0, p: 'AM' as const },
                { label: '12:00 PM', h: 12, m: 0, p: 'PM' as const },
                { label: '03:30 PM', h: 3, m: 30, p: 'PM' as const },
                { label: '08:00 PM', h: 8, m: 0, p: 'PM' as const },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.h, preset.m, preset.p)}
                  className={cn(
                    "py-1 px-1.5 rounded-lg border text-center font-medium transition-all",
                    hour === preset.h && minute === preset.m && period === preset.p
                      ? isDark 
                        ? "bg-purple-600 border-purple-400 text-white" 
                        : "bg-purple-600 border-purple-500 text-white"
                      : isDark 
                        ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-purple-500/40" 
                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="mt-5 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-2">
            {initialTime ? (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors",
                  isDark 
                    ? "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50" 
                    : "border-red-200 text-red-600 hover:bg-red-50"
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold border transition-colors",
                  isDark 
                    ? "border-white/10 text-gray-400 hover:text-white hover:bg-white/5" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
                )}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                isDark 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg"
              )}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Set Alert ({get24HourString()})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
