import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import RPGProgressBar from './RPGProgressBar';
import { Calendar, Zap, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export interface QuestGalleryProps {
  title: string;
  type: 'active' | 'finished' | 'unfinished';
  quests: Project[];
  loading?: boolean;
  onOpenStatusModal?: (data: {
    level: number;
    previousLevel: number;
    questName: string;
    xpGained: number;
    type: 'levelup' | 'quest_complete';
  }) => void;
  accentColor?: 'purple' | 'green' | 'red';
}

export function getRankBadge(progress: number, type: 'active' | 'finished' | 'unfinished') {
  if (type === 'finished' || progress === 100) {
    return { rank: 'S-RANK', label: 'MONARCH', color: 'from-amber-400 to-yellow-500 text-yellow-950 border-amber-300' };
  }
  if (type === 'unfinished') {
    return { rank: 'EXPIRED', label: 'PENALTY', color: 'from-rose-500 to-red-600 text-white border-rose-400' };
  }
  if (progress >= 70) {
    return { rank: 'A-RANK', label: 'AWAKENED', color: 'from-purple-500 to-indigo-500 text-white border-purple-300' };
  }
  if (progress >= 40) {
    return { rank: 'B-RANK', label: 'ELITE', color: 'from-cyan-500 to-blue-600 text-white border-cyan-300' };
  }
  if (progress > 0) {
    return { rank: 'C-RANK', label: 'INITIATE', color: 'from-emerald-500 to-teal-600 text-white border-emerald-300' };
  }
  return { rank: 'E-RANK', label: 'NOVICE', color: 'from-zinc-500 to-zinc-600 text-white border-zinc-400' };
}

export function QuestGalleryCard({
  project,
  type,
  index,
}: {
  project: Project;
  type: 'active' | 'finished' | 'unfinished';
  index: number;
  onOpenStatusModal?: (data: {
    level: number;
    previousLevel: number;
    questName: string;
    xpGained: number;
    type: 'levelup' | 'quest_complete';
  }) => void;
}) {
  const navigate = useNavigate();
  const rankInfo = getRankBadge(project.progress, type);

  // Modern asymmetric theme styling based on quest state
  const isFinished = type === 'finished';
  const isUnfinished = type === 'unfinished';

  const glowBorderClass = isFinished
    ? 'border-emerald-500/30 hover:border-emerald-400/80 shadow-[0_4px_30px_rgba(16,185,129,0.12)]'
    : isUnfinished
    ? 'border-rose-500/30 hover:border-rose-400/80 shadow-[0_4px_30px_rgba(244,63,94,0.12)]'
    : 'border-purple-500/25 hover:border-purple-400/80 shadow-[0_4px_30px_rgba(168,85,247,0.12)]';

  const headerBgClass = isFinished
    ? 'from-emerald-950/60 via-emerald-900/30 to-transparent dark:from-emerald-950/80'
    : isUnfinished
    ? 'from-rose-950/60 via-rose-900/30 to-transparent dark:from-rose-950/80'
    : 'from-purple-950/60 via-purple-900/30 to-transparent dark:from-purple-950/80';

  const accentText = isFinished
    ? 'text-emerald-600 dark:text-emerald-400'
    : isUnfinished
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-purple-600 dark:text-purple-400';

  return (
    <motion.div
      onClick={() => navigate(`/project/${project.id}`)}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/project/${project.id}`);
        }
      }}
      className={`group relative flex flex-col justify-between w-[84vw] xs:w-[310px] sm:w-[360px] md:w-[390px] max-w-[390px] shrink-0 snap-start rounded-3xl border bg-white/80 dark:bg-zinc-950/85 backdrop-blur-md overflow-hidden transition-all duration-300 select-none cursor-pointer ${glowBorderClass}`}
    >
      {/* Asymmetric Top Accent Strip / Corner Cutout Marker */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 z-20" />
      
      {/* Background Watermark Index */}
      <div className="absolute top-2 right-4 text-7xl sm:text-8xl font-black font-mono tracking-tighter opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none z-0">
        {(index + 1).toString().padStart(2, '0')}
      </div>

      {/* Top Banner Gallery Header - Asymmetric Visual Section */}
      <div className={`relative px-5 pt-5 pb-4 bg-gradient-to-b ${headerBgClass} z-10`}>
        {/* Asymmetric Top Meta Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Asymmetric Rank Tag */}
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-gradient-to-r border shadow-sm ${rankInfo.color}`}
            >
              {rankInfo.rank}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-widest hidden sm:inline">
              // {rankInfo.label}
            </span>
          </div>
        </div>

        {/* Quest Title & Asymmetric Typography */}
        <div className="mt-4 space-y-1.5">
          <h3
            title={project.name}
            className={`text-sm sm:text-base font-normal font-heading tracking-wide uppercase transition-colors line-clamp-2 min-h-[2.5rem] leading-relaxed ${accentText}`}
          >
            {project.name}
          </h3>

          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 opacity-70" />
              <span>{project.targetDate || 'No deadline'}</span>
            </div>
            {project.goal && (
              <span className="truncate max-w-[150px] opacity-75 font-sans">
                • {project.goal}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center Body - Asymmetric Progress */}
      <div className="px-5 py-4 space-y-4 z-10 flex-1 flex flex-col justify-center">
        <RPGProgressBar
          value={project.progress}
          max={100}
          label="Progress"
          showValue={true}
          color={isFinished ? 'bg-emerald-500' : isUnfinished ? 'bg-rose-500' : 'bg-purple-500'}
        />
      </div>

      {/* Asymmetric Footer - Action Row */}
      <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-900/80 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end z-10">
        <button
          onClick={() => navigate(`/project/${project.id}`)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 group-hover:translate-x-0.5 cursor-pointer ${
            isFinished
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
              : isUnfinished
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white'
              : 'bg-purple-600/10 text-purple-600 dark:text-purple-300 hover:bg-purple-600 hover:text-white'
          }`}
        >
          <span>{isFinished ? 'ARCHIVE' : 'ENTER QUEST'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function QuestGallery({
  title,
  type,
  quests,
  loading = false,
  onOpenStatusModal,
  accentColor = 'purple',
}: QuestGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Update scroll gradient states on scroll
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [quests, loading]);

  const badgeColor =
    accentColor === 'green'
      ? 'bg-emerald-500'
      : accentColor === 'red'
      ? 'bg-rose-500'
      : 'bg-purple-500';

  const titleColor =
    accentColor === 'green'
      ? 'text-emerald-500 dark:text-emerald-400'
      : accentColor === 'red'
      ? 'text-rose-500 dark:text-rose-400'
      : 'text-gray-900 dark:text-white';

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Modern Asymmetric Section Header */}
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-7 sm:h-9 ${badgeColor} rounded-full shrink-0 shadow-sm`} />
        <div>
          <h2 className={`text-xs sm:text-sm md:text-base font-normal uppercase tracking-wider font-heading ${titleColor}`}>
            {title}
          </h2>
        </div>
      </div>

      {/* Gallery Reel Carousel Container */}
      {loading ? (
        <div className="flex gap-5 sm:gap-6 overflow-x-hidden pb-4 pt-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[310px] sm:w-[360px] md:w-[390px] h-72 shrink-0 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : quests.length > 0 ? (
        <div className="relative group/gallery">
          {/* Subtle Side Fade Overlays indicating horizontal continuity */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-white dark:from-black to-transparent z-20 transition-opacity duration-200 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-white dark:from-black to-transparent z-20 transition-opacity duration-200 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Smooth Snap Scroll Gallery Track */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 pt-1 px-1 no-scrollbar select-none focus:outline-none"
            tabIndex={0}
          >
            {quests.map((project, idx) => (
              <QuestGalleryCard
                key={project.id}
                project={project}
                type={type}
                index={idx}
                onOpenStatusModal={onOpenStatusModal}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Asymmetric Empty Gallery Frame */
        <div className="text-center py-14 px-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-normal text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-heading">
            No Quests in Gallery
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">
            New entries will appear in this showcase as they are accepted.
          </p>
        </div>
      )}
    </section>
  );
}
