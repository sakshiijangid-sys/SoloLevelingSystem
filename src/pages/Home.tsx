import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import RPGProgressBar from '../components/RPGProgressBar';
import { Trophy, Plus, Calendar, ChevronRight, Zap, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { isPast, parseISO, startOfDay, endOfDay } from 'date-fns';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
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
    
      const totalPoints = projects.reduce((acc, p) => acc + (p.xp || 0), 0);
      
      const QuestCard = ({ project, type }: { project: Project; type: 'active' | 'finished' | 'unfinished'; key?: string }) => (
        <motion.div
          whileHover={{ y: -5 }}
          className={`bg-white/50 dark:bg-gray-900/40 border rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 transition-all group backdrop-blur-sm ${
            type === 'finished' ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' :
            type === 'unfinished' ? 'border-red-500/30' :
            'border-gray-200 dark:border-purple-500/20 hover:border-purple-500/50 shadow-sm dark:shadow-none'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1 overflow-hidden">
              <h3 className={`text-base sm:text-xl font-bold transition-colors uppercase tracking-tight truncate ${
                type === 'finished' ? 'text-green-600 dark:text-green-400' :
                type === 'unfinished' ? 'text-red-600 dark:text-red-400' :
                'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'
              }`}>
                {project.name}
              </h3>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-mono">
                <Calendar className="w-2.5 h-2.5 sm:w-3 h-3" />
                {project.targetDate}
              </div>
            </div>
            <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-black italic border shrink-0 ${
              type === 'finished' ? 'bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-400 border-green-500/30' :
              type === 'unfinished' ? 'bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border-red-500/30' :
              'bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
            }`}>
              {type === 'finished' ? 'DONE' : `Level ${project.level}`}
            </div>
          </div>
    
          <RPGProgressBar 
            value={project.progress} 
            max={100} 
            label="Progress" 
            showValue={true}
            color={type === 'finished' ? 'bg-green-500' : type === 'unfinished' ? 'bg-red-500' : 'bg-purple-500'}
          />
    
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Points: {project.xp}
            </div>
            <button 
              onClick={() => navigate(`/project/${project.id}`)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white font-bold text-xs uppercase tracking-widest flex items-center gap-1 transition-all"
            >
              {type === 'finished' ? 'View Details' : type === 'unfinished' ? 'See Why' : 'Open Quest'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-20 pb-20 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-20">
        
        <section className={`relative h-[400px] sm:h-[600px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-purple-500/30 group shadow-2xl transition-all duration-700 ${isDark ? 'bg-black px-4' : 'bg-purple-50 px-4'}`}>
          {/* Anime Room Background Layers */}
          <div className="absolute inset-0 z-0">
            {isDark ? (
              /* DARK MODE: Cozy Night Study Room */
              <div className="absolute inset-0 bg-[#150f35]">
                {/* Wall Base with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1c1544] via-[#241b5e] to-[#150f35]" />
                
                {/* Shelf Unit on Left Wall */}
                <div className="absolute top-12 left-8 w-40 h-64 flex flex-col gap-8 opacity-40">
                  <div className="h-1 bg-white/10 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                    <div className="absolute -top-6 left-4 w-8 h-6 bg-indigo-900/40 rounded-sm" />
                    <div className="absolute -top-4 left-14 w-6 h-4 bg-purple-900/40 rounded-sm" />
                  </div>
                  <div className="h-1 bg-white/10 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                    <div className="absolute -top-10 left-2 w-12 h-10 bg-blue-900/40 rounded-sm" />
                  </div>
                </div>

                {/* Polaroid Photos on wall */}
                <div className="absolute top-24 left-1/4 flex gap-4 -rotate-6 opacity-60">
                  <div className="w-12 h-14 bg-white/90 p-1 shadow-md border-b-4 border-gray-200">
                    <div className="w-full h-10 bg-indigo-950 rounded-sm" />
                  </div>
                  <div className="w-10 h-12 bg-white/80 p-1 shadow-md border-b-4 border-gray-200 translate-y-4 rotate-12">
                    <div className="w-full h-8 bg-purple-950 rounded-sm" />
                  </div>
                </div>
                
                {/* Window with City Night View */}
                <div className="absolute top-12 right-12 w-56 h-72 bg-[#05051a] rounded-xl border-[6px] border-gray-800/90 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-x-0 top-0 h-4 bg-gray-800/80 z-20" />
                  <div className="absolute inset-y-0 right-0 w-2 bg-gray-800/80 z-20" />
                  
                  {/* Night Sky & Stars */}
                  <div className="absolute inset-0 opacity-60">
                    {[...Array(15)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" 
                        style={{ 
                          top: `${Math.random()*100}%`, 
                          left: `${Math.random()*100}%`,
                          animationDelay: `${Math.random()*5}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* City Buildings */}
                  <div className="absolute bottom-0 inset-x-0 h-24 flex items-end justify-around px-1 gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-5 bg-indigo-950/80 rounded-t-sm relative" style={{ height: `${Math.random()*60+30}%` }}>
                        {/* Windows in buildings */}
                        <div className="absolute inset-x-1 top-2 flex flex-col gap-1">
                           {[...Array(4)].map((_, j) => (
                             <div key={j} className="h-1 bg-yellow-400/20 rounded-sm" />
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fairy Lights (String Lights) */}
                <div className="absolute top-0 inset-x-0 h-24">
                   <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                      <path d="M0,20 Q250,80 500,20 T1000,20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                   </svg>
                   {[...Array(12)].map((_, i) => (
                     <motion.div 
                        key={i}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2 + Math.random()*2, repeat: Infinity, delay: Math.random()*2 }}
                        className="absolute w-2 h-2 bg-yellow-200 rounded-full blur-[2px] shadow-[0_0_10px_#fef08a]"
                        style={{ left: `${(i*8) + 5}%`, top: `${Math.sin(i*0.8) * 20 + 35}px` }}
                     />
                   ))}
                </div>

                {/* Desk Surface (Bottom perspective) */}
                <div className="absolute bottom-0 inset-x-0 h-44 bg-[#1a1635] border-t-2 border-purple-500/10 flex flex-col justify-end px-16 pb-6">
                  {/* Laptop Shape - Enhanced 3D feel */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-80 h-48 bg-gray-900 rounded-t-2xl border-x-4 border-t-4 border-gray-800 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 transform perspective-[1000px] rotateX(5deg)">
                     <div className="absolute inset-0 bg-purple-600/10 blur-xl animate-pulse" />
                     {/* Screen Mockup */}
                     <div className="absolute inset-4 bg-gray-950 rounded-lg border border-purple-500/20 flex flex-col p-3 gap-2">
                        <div className="w-1/2 h-2 bg-purple-500/40 rounded-full" />
                        <div className="w-3/4 h-2 bg-gray-800 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.3)]" />
                        <div className="w-1/4 h-2 bg-blue-500/40 rounded-full" />
                     </div>
                  </div>

                  {/* 3D Desk Items */}
                  <div className="flex justify-between items-end relative z-10">
                    <div className="flex gap-10 items-end">
                       {/* Stack of books with depth */}
                       <div className="flex flex-col-reverse -space-y-reverse -space-y-1 transform -rotate-1 skew-x-1">
                          <div className="w-24 h-6 bg-red-900/50 rounded-sm border-l-4 border-red-800 shadow-md" />
                          <div className="w-22 h-5 bg-blue-900/50 rounded-sm border-l-4 border-blue-800 shadow-md" />
                          <div className="w-26 h-4 bg-purple-900/50 rounded-sm border-l-4 border-purple-800 shadow-md" />
                       </div>
                       {/* Coffee Cup with Steam */}
                       <div className="w-10 h-12 bg-gray-800/80 rounded-b-lg rounded-t-sm relative border-t border-gray-700 shadow-lg">
                          <motion.div 
                            animate={{ y: [-5, -15], opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/10 rounded-full blur-md"
                          />
                       </div>
                    </div>
                    {/* Retro Desk Lamp on far right */}
                    <div className="relative w-24 h-40 flex flex-col items-center">
                       <div className="w-2 h-32 bg-gray-800 rounded-full" />
                       <div className="absolute bottom-0 w-16 h-4 bg-gray-900 rounded-full border-t border-white/5" />
                       <div className="absolute top-0 -left-4 w-12 h-8 bg-gray-800 rounded-full -rotate-45" />
                       <div className="absolute top-2 -left-8 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Overall Room Depth Shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              /* LIGHT MODE: Bright Learning Room Details */
              <div className="absolute inset-0 bg-purple-50">
                {/* Sunlight Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/50 via-white to-orange-50/50" />
                
                {/* Wall Pegboard (3D perspective) */}
                <div className="absolute top-8 left-8 w-64 h-80 bg-white/60 rounded-2xl border-2 border-white/80 p-6 grid grid-cols-6 grid-rows-8 gap-4 shadow-xl backdrop-blur-sm transform -rotate-1 skew-y-1">
                   {[...Array(24)].map((_, i) => (
                     <div key={i} className="w-1.5 h-1.5 bg-purple-200 rounded-full shadow-inner" />
                   ))}
                   {/* Hanging Items */}
                   <div className="absolute top-12 left-8 w-24 h-4 bg-purple-400/40 rounded-full shadow-lg" />
                   <div className="absolute top-24 left-16 w-8 h-12 bg-pink-400/40 rounded-lg shadow-lg rotate-12" />
                </div>

                {/* Shadow from imaginary window frame */}
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_60%,rgba(0,0,0,0.03)_61%,rgba(0,0,0,0.03)_63%,transparent_64%)]" />

                {/* Floating Soft Clouds */}
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ x: i % 2 === 0 ? [-20, 20] : [20, -20] }} 
                    transition={{ duration: 15 + i*2, repeat: Infinity, ease: "easeInOut" }} 
                    className="absolute bg-white/70 rounded-full blur-2xl" 
                    style={{ 
                      top: `${5 + i*18}%`, 
                      left: `${10 + i*15}%`,
                      width: `${140 + i*30}px`,
                      height: `${70 + i*15}px`,
                      opacity: 0.6
                    }}
                  />
                ))}

                {/* Desk Surface (Wooden Vibe with depth) */}
                <div className="absolute bottom-0 inset-x-0 h-52 bg-gradient-to-b from-orange-50/95 to-orange-100/95 border-t-4 border-orange-200/50 shadow-[0_-20px_50px_rgba(0,0,0,0.04)] backdrop-blur-md px-24">
                   {/* Art & Study Supplies Layered */}
                   <div className="flex justify-between h-full pt-10">
                      <div className="flex gap-6 items-end pb-8">
                         {/* 3D Marker Case */}
                         <div className="bg-white/90 p-3 rounded-t-2xl border border-orange-100 flex gap-1.5 items-end h-28 shadow-xl transform skew-x-1">
                            {[...Array(10)].map((_, i) => (
                               <div key={i} className="w-3 h-20 rounded-full shadow-sm" style={{ backgroundColor: ['#FDA4AF', '#FCD34D', '#6EE7B7', '#93C5FD', '#C4B5FD', '#F9A8D4', '#67E8F9', '#BEF264', '#F87171', '#818CF8'][i] }} />
                            ))}
                         </div>
                         {/* Layered Notebooks */}
                         <div className="relative w-40 h-44 group">
                           <div className="absolute top-4 left-2 w-full h-full bg-purple-100 rounded-xl shadow-lg transform rotate-6 scale-95" />
                           <div className="absolute inset-0 bg-white rounded-xl shadow-xl border border-orange-100 p-5 flex flex-col gap-4 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                              <div className="w-full h-1.5 bg-gray-100 rounded-full" />
                              <div className="w-2/3 h-1.5 bg-gray-100 rounded-full" />
                              <div className="mt-auto w-full aspect-square bg-purple-50/70 rounded-xl border-2 border-dashed border-purple-100 flex items-center justify-center">
                                 <span className="text-purple-300 text-xs">SKETCH</span>
                              </div>
                           </div>
                         </div>
                      </div>
                      
                      {/* Tablets & Tech items */}
                      <div className="flex gap-4 items-end pb-8">
                         <div className="w-48 h-32 bg-gray-200/90 rounded-2xl border-4 border-white shadow-2xl relative overflow-hidden transform skew-y-2">
                            <div className="absolute inset-0 bg-purple-200/20" />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                         </div>

                         {/* Flower Vase with more detail */}
                         <div className="relative w-24 h-40 flex flex-col items-center">
                            <div className="w-16 h-20 bg-white/50 border-2 border-white/90 rounded-2xl backdrop-blur-xl shadow-inner overflow-hidden">
                               <div className="w-full h-full bg-purple-100/30" />
                            </div>
                            <div className="absolute -top-6 w-full flex justify-center gap-1">
                               <div className="w-6 h-16 bg-pink-300/40 rounded-full blur-[1px] rotate-[15deg] origin-bottom shadow-lg" />
                               <div className="w-5 h-14 bg-purple-300/40 rounded-full blur-[1px] rotate-[-15deg] origin-bottom shadow-lg" />
                               <div className="w-4 h-12 bg-purple-300/40 rounded-full blur-[1px] rotate-[45deg] origin-bottom shadow-lg" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Sunlight Dust Particles */}
                <div className="absolute inset-0 pointer-events-none z-10">
                   {[...Array(15)].map((_, i) => (
                     <motion.div 
                        key={i}
                        animate={{ y: [-20, 20], x: [-10, 10], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 5 + Math.random()*4, repeat: Infinity }}
                        className="absolute w-1.5 h-1.5 bg-white rounded-full blur-[1px]"
                        style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%` }}
                     />
                   ))}
                </div>
              </div>
            )}
          </div>

          {/* Vibe Overlays */}
          <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-700 ${isDark ? 'opacity-40' : 'opacity-10'}`}>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center p-4 sm:p-8 space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="space-y-4 relative"
            >
              <div className="relative group">
                {/* Floating Core Glow */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className={`absolute -inset-16 blur-[80px] rounded-full pointer-events-none transition-colors ${isDark ? 'bg-purple-500/40' : 'bg-white/60'}`}
                />

                <h1 className="relative z-10 text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase italic select-none">
                  {/* Glass Base Layer */}
                  <span className={`absolute inset-0 bg-clip-text text-transparent blur-[1px] translate-y-0.5 ${isDark ? 'bg-gradient-to-b from-purple-600/20 to-black/20' : 'bg-gradient-to-b from-purple-400/20 to-white/20'}`}>
                    Solo Leveling System
                  </span>
                  
                  {/* Shiny Edge Liquid Layer */}
                  <motion.span 
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className={`relative bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-2xl ${
                        isDark 
                        ? 'bg-gradient-to-r from-gray-900 via-purple-500 to-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                        : 'bg-gradient-to-r from-gray-900 via-purple-600 to-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    }`}
                  >
                    Solo Leveling System
                  </motion.span>
                </h1>
              </div>

              <p className={`font-mono tracking-[0.2em] uppercase text-sm md:text-base font-bold transition-colors ${isDark ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-purple-800'}`}>
                Level up your learning experience
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3 pt-2 sm:pt-4">
              {authLoading ? (
                <div className="w-40 h-12 bg-purple-900/20 border border-purple-500/20 rounded-xl animate-pulse" />
              ) : (
                <>
                  {user ? (
                    <Link 
                      to="/new-project"
                      className={`px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black flex items-center gap-2 sm:gap-3 transition-all hover:-translate-y-1 shadow-xl uppercase tracking-[0.2em] ${
                          isDark 
                          ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                          : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)]'
                      }`}
                    >
                      <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
                      START NEW QUEST
                    </Link>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <Link 
                        to="/login"
                        className={`px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black flex items-center gap-2 sm:gap-3 transition-all hover:-translate-y-1 shadow-xl uppercase tracking-[0.2em] ${
                            isDark 
                            ? 'bg-purple-600 text-white hover:bg-purple-500' 
                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)]'
                        }`}
                      >
                        <Zap className="w-4 h-4 sm:w-6 sm:h-6 animate-bounce" />
                        ACCESS SYSTEM
                      </Link>
                      
                      <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-colors ${
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


        {/* Quest Sections */}
        <div className="space-y-16 sm:space-y-24">
          {/* Active Quests */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-purple-500 rounded-full" />
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Current Quests</h2>
            </div>
            
            {authLoading || loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900/50 rounded-2xl animate-pulse border border-gray-200 dark:border-gray-800" />
                ))}
              </div>
            ) : activeQuests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeQuests.map(p => <QuestCard key={p.id} project={p} type="active" />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <Zap className="w-12 h-12 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">No Active Quests</h3>
                <p className="text-gray-500 dark:text-gray-700 text-sm mt-1">Ready to start something new?</p>
              </div>
            )}
          </section>

          {/* Finished Quests */}
          {finishedQuests.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-green-500 rounded-full" />
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-green-400">Finished Quests</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {finishedQuests.map(p => <QuestCard key={p.id} project={p} type="finished" />)}
              </div>
            </section>
          )}

          {/* Remaining/Unfinished Quests */}
          {unfinishedQuests.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-red-500 rounded-full" />
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-red-500">Remaining Quests</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unfinishedQuests.map(p => <QuestCard key={p.id} project={p} type="unfinished" />)}
              </div>
            </section>
          )}

          {!loading && !authLoading && projects.length === 0 && (
            <div className="text-center py-24 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
              <Trophy className="w-16 h-16 text-gray-800 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 uppercase tracking-widest">No Quests Found</h3>
              <p className="text-gray-700 mt-2">Start a new quest to begin tracking your progress.</p>
              {user && (
                <Link to="/new-project" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all uppercase tracking-widest text-sm">
                  Get Started
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
