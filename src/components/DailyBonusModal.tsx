import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, X, Check, ArrowRight } from 'lucide-react';
import { useDailyBonus, calculateDailyBonusXP } from '../contexts/DailyBonusContext';
import { cn } from '../lib/utils';
import { playDailyBonusSound } from '../lib/soundEffects';

export default function DailyBonusModal() {
  const { bonusStatus, showModal, setShowModal, claimBonus } = useDailyBonus();

  const streak = bonusStatus.streak || 1;
  const todayXP = bonusStatus.todayBonusXP || calculateDailyBonusXP(streak);

  // Play synthesized audio chime on modal open
  useEffect(() => {
    if (showModal) {
      playDailyBonusSound();
    }
  }, [showModal]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, setShowModal]);

  // 7-day streak rewards roadmap
  const streakDays = useMemo(() => {
    const activeDayIndex = ((streak - 1) % 7); // 0 to 6
    return Array.from({ length: 7 }).map((_, idx) => {
      const dayNum = idx + 1;
      const xpValue = calculateDailyBonusXP(dayNum);
      const isClaimed = idx < activeDayIndex;
      const isCurrentToday = idx === activeDayIndex;
      const isUpcoming = idx > activeDayIndex;
      const isMilestone = dayNum === 7;

      return {
        day: dayNum,
        xp: xpValue,
        isClaimed,
        isCurrentToday,
        isUpcoming,
        isMilestone
      };
    });
  }, [streak]);

  return (
    <AnimatePresence>
      {showModal && (
        <div 
          id="solo-daily-bonus-overlay" 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Subtle Dim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Minimal Asymmetric Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 w-full max-w-md my-auto"
          >
            {/* Modal Card */}
            <div className="relative bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 text-white shadow-2xl overflow-hidden">
              
              {/* Subtle top ambient gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/80 via-indigo-500/40 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-zinc-400">
                    Daily Bonus
                  </span>
                </div>
                <button
                  id="btn-close-daily-bonus"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                  aria-label="Close daily bonus modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Content: Asymmetric Value Display */}
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-white">
                    +{todayXP}
                    <span className="text-xl sm:text-2xl font-bold text-purple-400 ml-1.5 font-sans">XP</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Daily reward added to your hunter profile.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold">{streak} {streak === 1 ? 'day' : 'days'}</span>
                </div>
              </div>

              {/* 7-Day Tracker */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  <span>7-Day Streak</span>
                  <span>Day {((streak - 1) % 7) + 1} of 7</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {streakDays.map((d) => (
                    <div
                      key={d.day}
                      className={cn(
                        "flex flex-col items-center justify-between py-2 px-1 rounded-xl border text-center transition-colors min-h-[58px]",
                        d.isCurrentToday
                          ? "bg-purple-950/40 border-purple-500/80 text-white"
                          : d.isClaimed
                          ? "bg-zinc-900/60 border-zinc-800 text-zinc-400"
                          : "bg-zinc-900/20 border-zinc-800/40 text-zinc-500"
                      )}
                    >
                      <span className="text-[9px] font-mono font-medium">
                        D{d.day}
                      </span>

                      {d.isClaimed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className={cn(
                          "text-[10px] font-mono font-bold",
                          d.isCurrentToday ? "text-purple-300" : "text-zinc-500"
                        )}>
                          +{d.xp}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-claim-daily-bonus"
                onClick={claimBonus}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
