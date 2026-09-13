import React from 'react';
import { Shield, Zap, Crown, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export interface QuestLevelMilestone {
  level: number;
  name: string;
  triggerPercent: number;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  rewardXP: number;
}

export const QUEST_LEVEL_MILESTONES: QuestLevelMilestone[] = [
  {
    level: 1,
    name: 'Initiate Awakening',
    triggerPercent: 40,
    description: 'Establish consistent habit discipline',
    badge: 'Tier I',
    icon: Shield,
    rewardXP: 200
  },
  {
    level: 2,
    name: 'Awakened Hunter',
    triggerPercent: 70,
    description: 'Deep mastery and habit resilience',
    badge: 'Tier II',
    icon: Zap,
    rewardXP: 350
  },
  {
    level: 3,
    name: 'Shadow Monarch',
    triggerPercent: 100,
    description: 'Complete quest mastery and full clearance',
    badge: 'Tier III',
    icon: Crown,
    rewardXP: 500
  }
];

export const calculateQuestLevel = (progress: number): number => {
  if (progress >= 100) return 3;
  if (progress >= 70) return 2;
  if (progress >= 40) return 1;
  return 0;
};

export const getQuestLevelDetails = (progress: number) => {
  const level = calculateQuestLevel(progress);
  if (level === 3) {
    return {
      level: 3,
      label: 'Level 3 / 3',
      title: 'Shadow Monarch',
      status: 'Mastered',
      nextGoal: null,
      progressToNext: 100
    };
  }
  if (level === 2) {
    return {
      level: 2,
      label: 'Level 2 / 3',
      title: 'Awakened Hunter',
      status: 'Active',
      nextGoal: 100,
      progressToNext: Math.min(100, Math.round(((progress - 70) / 30) * 100))
    };
  }
  if (level === 1) {
    return {
      level: 1,
      label: 'Level 1 / 3',
      title: 'Initiate Awakening',
      status: 'Active',
      nextGoal: 70,
      progressToNext: Math.min(100, Math.round(((progress - 40) / 30) * 100))
    };
  }
  return {
    level: 0,
    label: 'Initiate (0 / 3)',
    title: 'Pathfinder',
    status: 'In Training',
    nextGoal: 40,
    progressToNext: Math.min(100, Math.round((progress / 40) * 100))
  };
};

interface QuestLevelListProps {
  progress: number;
  onPreviewLevel?: (level: number) => void;
  className?: string;
}

export default function QuestLevelList({ progress, onPreviewLevel, className }: QuestLevelListProps) {
  const currentLevel = calculateQuestLevel(progress);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-heading font-normal uppercase tracking-wider text-gray-900 dark:text-white">
            Quest Level Milestones
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold tracking-wider uppercase">
          {currentLevel === 0 ? 'Approaching Lv. 1' : `Rank Level ${currentLevel} of 3`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {QUEST_LEVEL_MILESTONES.map((milestone) => {
          const isAchieved = progress >= milestone.triggerPercent;
          const isNextTarget = !isAchieved && (
            (milestone.level === 1 && progress < 40) ||
            (milestone.level === 2 && progress >= 40 && progress < 70) ||
            (milestone.level === 3 && progress >= 70 && progress < 100)
          );
          const isLocked = !isAchieved && !isNextTarget;

          const IconComponent = milestone.icon;

          return (
            <div
              key={milestone.level}
              onClick={onPreviewLevel ? () => onPreviewLevel(milestone.level) : undefined}
              role={onPreviewLevel ? "button" : undefined}
              tabIndex={onPreviewLevel ? 0 : undefined}
              onKeyDown={onPreviewLevel ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPreviewLevel(milestone.level);
                }
              } : undefined}
              className={cn(
                "relative group overflow-hidden rounded-xl border p-3 sm:p-3.5 transition-all text-left flex flex-col justify-between",
                onPreviewLevel && "cursor-pointer",
                isAchieved
                  ? "bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/40 dark:border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-purple-500/70"
                  : isNextTarget
                  ? "bg-white dark:bg-zinc-900/80 border-purple-500/30 dark:border-purple-500/30 shadow-sm hover:border-purple-500/60"
                  : "bg-gray-50/70 dark:bg-zinc-950/40 border-gray-200/70 dark:border-white/5 opacity-70 hover:opacity-90"
              )}
            >
              {/* Top Row: Icon + Badge + Trigger Tag */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shrink-0",
                    isAchieved
                      ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      : isNextTarget
                      ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      : "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400"
                  )}>
                    {isAchieved ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <IconComponent className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xs sm:text-sm font-heading font-normal uppercase tracking-wide",
                        isAchieved 
                          ? "text-purple-700 dark:text-purple-300"
                          : isNextTarget
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        Level {milestone.level}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 line-clamp-1">
                      {milestone.name}
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider shrink-0",
                  isAchieved
                    ? "bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                    : isNextTarget
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                    : "bg-gray-200/50 dark:bg-zinc-800/50 text-gray-400 border border-transparent"
                )}>
                  {isAchieved ? "UNLOCKED" : isNextTarget ? "TARGET" : "LOCKED"}
                </div>
              </div>

              {/* Middle: Trigger Criteria */}
              <div className="mt-1 mb-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                    Trigger Threshold
                  </span>
                  <span className={cn(
                    "font-bold",
                    isAchieved
                      ? "text-purple-600 dark:text-purple-400"
                      : isNextTarget
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-400"
                  )}>
                    {milestone.triggerPercent}%
                  </span>
                </div>

                {/* Sleek Milestone Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200/80 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      isAchieved
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                        : isNextTarget
                        ? "bg-gradient-to-r from-amber-400 to-purple-500"
                        : "bg-gray-400/40"
                    )}
                    style={{
                      width: `${Math.min(100, Math.round((progress / milestone.triggerPercent) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Bottom Row: XP reward */}
              <div className="flex items-center justify-end text-[9px] font-mono border-t border-gray-200/60 dark:border-white/5 pt-2 text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                  +{milestone.rewardXP} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
