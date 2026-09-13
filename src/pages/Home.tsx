import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDailyBonus } from '../contexts/DailyBonusContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import RPGProgressBar from '../components/RPGProgressBar';
import { calculateQuestLevel } from '../components/QuestLevelList';
import LevelUpOverlay from '../components/LevelUpOverlay';
import QuestGallery from '../components/QuestGallery';
import { Trophy, Plus, Calendar, ChevronRight, Zap, AlertCircle, CheckCircle2, XCircle, Flame, Sparkles, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { isPast, parseISO, startOfDay, endOfDay } from 'date-fns';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { bonusStatus, openBonusModal } = useDailyBonus();
  const isDark = theme === 'dark';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    level: number;
    previousLevel: number;
    questName: string;
    xpGained: number;
    type: 'levelup' | 'quest_complete';
  }>({
    level: 1,
    previousLevel: 1,
    questName: '',
    xpGained: 500,
    type: 'quest_complete'
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      // Sort in-memory by createdAt descending
      projectsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const { activeQuests, finishedQuests, unfinishedQuests } = useMemo(() => {
    return {
      activeQuests: projects.filter(p => p.progress < 100 && p.targetDate && !isPast(endOfDay(parseISO(p.targetDate)))),
      finishedQuests: projects.filter(p => p.progress === 100),
      unfinishedQuests: projects.filter(p => p.progress < 100 && p.targetDate && isPast(endOfDay(parseISO(p.targetDate))))
    };
  }, [projects]);

  const handleOpenStatusModal = (data: {
    level: number;
    previousLevel: number;
    questName: string;
    xpGained: number;
    type: 'levelup' | 'quest_complete';
  }) => {
    setLevelUpData(data);
    setShowLevelUpModal(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-16 xs:pt-20 sm:pt-24 pb-16 sm:pb-24 px-3 xs:px-4 sm:px-6 lg:px-8 transition-colors duration-300 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-14 md:space-y-16 lg:space-y-20">
        
        <section className={`relative min-h-[350px] xs:min-h-[380px] sm:min-h-[480px] md:h-[540px] lg:h-[600px] rounded-2xl xs:rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-purple-500/30 shadow-2xl transition-colors duration-700 flex items-center justify-center ${isDark ? 'bg-black px-3 sm:px-6' : 'bg-purple-50 px-3 sm:px-6'}`}>
          {/* Theme Background Images */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Dark Theme Image */}
            <img 
              src="https://i.pinimg.com/736x/ce/c0/10/cec01034e7a2542dcc34ceff07beca56.jpg"
              alt="Dark Theme Background"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
                isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
            {/* Light Theme Image */}
            <img 
              src="https://i.pinimg.com/736x/1f/b9/41/1fb941fb26a02c3ef65cf96747124aca.jpg"
              alt="Light Theme Background"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
                !isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          </div>
          
          <div className="relative z-20 w-full flex flex-col justify-center items-center text-center p-3 xs:p-4 sm:p-8 space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative w-full max-w-5xl"
            >
              <div className="relative flex flex-col lg:flex-row items-center justify-center gap-2 xs:gap-3 sm:gap-4 lg:gap-6 flex-wrap">
                {/* Floating Core Glow - Golden aura */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: isDark ? [0.25, 0.45, 0.25] : [0.35, 0.55, 0.35],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-16 blur-[80px] rounded-full pointer-events-none bg-amber-400/25 dark:bg-amber-500/25"
                />

                <h1 className="relative z-10 text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-normal tracking-wide sm:tracking-wider uppercase select-none font-heading leading-tight sm:leading-relaxed py-1 shrink-0">
                  {/* Glowing / Soft Shadow Pixel Heading */}
                  <motion.span 
                    key={isDark ? 'heading-dark' : 'heading-light'}
                    animate={{ 
                      filter: [
                        "drop-shadow(0 0 8px rgba(251,191,36,0.9)) drop-shadow(0 0 22px rgba(245,158,11,0.7)) drop-shadow(0 0 40px rgba(217,119,6,0.45))",
                        "drop-shadow(0 0 14px rgba(251,191,36,1)) drop-shadow(0 0 32px rgba(245,158,11,0.85)) drop-shadow(0 0 55px rgba(217,119,6,0.6))",
                        "drop-shadow(0 0 8px rgba(251,191,36,0.9)) drop-shadow(0 0 22px rgba(245,158,11,0.7)) drop-shadow(0 0 40px rgba(217,119,6,0.45))"
                      ] 
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className={`inline-block font-heading transition-colors duration-300 ${
                      isDark 
                        ? 'text-white' 
                        : 'text-[#120224]'
                    }`}
                  >
                    Solo Leveling System
                  </motion.span>
                </h1>

                <p className="relative z-10 font-sans tracking-wider uppercase text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-zinc-950 dark:text-white/90 drop-shadow-none dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] transition-colors sm:whitespace-nowrap text-center">
                  Level up your learning experience
                </p>
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3 pt-2 sm:pt-4 pointer-events-auto">
              {authLoading ? (
                <div className="w-40 h-12 bg-purple-900/20 border border-purple-500/20 rounded-xl animate-pulse" />
              ) : (
                <>
                  {user ? (
                    <Link 
                      to="/new-project"
                      className={`px-5 xs:px-7 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-[11px] xs:text-xs sm:text-base font-black flex items-center gap-2 sm:gap-3 transition-all hover:-translate-y-1 shadow-xl uppercase tracking-[0.15em] sm:tracking-[0.2em] ${
                          isDark 
                          ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                          : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)]'
                      }`}
                    >
                      <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
                      START NEW QUEST
                    </Link>
                  ) : (
                    <div className="space-y-3 sm:space-y-6">
                      <Link 
                        to="/login"
                        className={`px-5 xs:px-7 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-[11px] xs:text-xs sm:text-base font-black flex items-center gap-2 sm:gap-3 transition-all hover:-translate-y-1 shadow-xl uppercase tracking-[0.15em] sm:tracking-[0.2em] ${
                            isDark 
                            ? 'bg-purple-600 text-white hover:bg-purple-500' 
                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)]'
                        }`}
                      >
                        <Zap className="w-4 h-4 sm:w-6 sm:h-6 animate-bounce" />
                        ACCESS SYSTEM
                      </Link>
                      
                      <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-colors ${
                          isDark 
                          ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' 
                          : 'text-purple-700 border-purple-500/30 bg-purple-50'
                      }`}>
                        Authentication Required to Save Data
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Daily Access Bonus & Hunter Streak Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/80 p-4 sm:p-5 backdrop-blur-sm transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-amber-500 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Daily Bonus
                  </span>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    +{bonusStatus.todayBonusXP || 50} XP Claimed
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  <span className="font-mono text-amber-600 dark:text-amber-400">{bonusStatus.streak || 1}-day streak</span> active
                </div>
              </div>
            </div>

            <button
              id="btn-open-daily-bonus-home"
              onClick={openBonusModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <span>7-Day Rewards</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Quest Gallery Sections */}
        <div className="space-y-16 sm:space-y-24">
          {/* Active Quests Gallery */}
          <QuestGallery
            title="Current Quests"
            type="active"
            quests={activeQuests}
            loading={authLoading || loading}
            onOpenStatusModal={handleOpenStatusModal}
            accentColor="purple"
          />

          {/* Finished Quests Gallery */}
          {finishedQuests.length > 0 && (
            <QuestGallery
              title="Finished Quests"
              type="finished"
              quests={finishedQuests}
              loading={authLoading || loading}
              onOpenStatusModal={handleOpenStatusModal}
              accentColor="green"
            />
          )}

          {/* Remaining/Unfinished Quests Gallery */}
          {unfinishedQuests.length > 0 && (
            <QuestGallery
              title="Remaining Quests"
              type="unfinished"
              quests={unfinishedQuests}
              loading={authLoading || loading}
              onOpenStatusModal={handleOpenStatusModal}
              accentColor="red"
            />
          )}

          {!loading && !authLoading && projects.length === 0 && (
            <div className="text-center py-24 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
              <Trophy className="w-16 h-16 text-gray-800 mx-auto mb-4" />
              <h3 className="text-xs sm:text-sm font-normal text-gray-500 uppercase tracking-widest font-heading">No Quests Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Start a new quest to begin tracking your progress.</p>
              {user && (
                <Link to="/new-project" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all uppercase tracking-widest text-xs font-heading">
                  Get Started
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Solo Leveling Level Up / Quest Completion Animated Fire Overlay */}
      <LevelUpOverlay
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        level={levelUpData.level}
        previousLevel={levelUpData.previousLevel}
        questName={levelUpData.questName}
        xpGained={levelUpData.xpGained}
        type={levelUpData.type}
      />
    </div>
  );
}
