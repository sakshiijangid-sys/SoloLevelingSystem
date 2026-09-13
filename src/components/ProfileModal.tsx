import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Zap, LogOut, Mail, Calendar, TrendingUp, ChevronDown, ChevronUp, Layers, CheckCircle2, Clock, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDailyBonus } from '../contexts/DailyBonusContext';
import { format, subMonths, isSameMonth } from 'date-fns';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { bonusStatus, openBonusModal } = useDailyBonus();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects for profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const questsCount = projects.length;
  const totalXP = projects.reduce((acc, p) => acc + (p.xp || 0), 0);

  const stats = useMemo(() => {
    return {
      current: projects.filter(p => p.progress > 0 && p.progress < 100).length,
      completed: projects.filter(p => p.progress >= 100).length,
      remaining: projects.filter(p => p.progress === 0).length,
    };
  }, [projects]);

  const chartData = useMemo(() => {
    if (!user?.metadata.creationTime) return [];
    
    const ensureDate = (val: any) => {
      if (!val) return new Date();
      if (val.toDate && typeof val.toDate === 'function') return val.toDate();
      return new Date(val);
    };

    // Generate 7 data points from creation until now
    const startDate = new Date(user.metadata.creationTime);
    const endDate = new Date();
    
    // Split into 7 points
    const intervals = Array.from({ length: 7 }).map((_, i) => {
      const time = startDate.getTime() + (endDate.getTime() - startDate.getTime()) * (i / 6);
      return new Date(time);
    });
    
    return intervals.map((date, i) => {
      const dateStr = format(date, 'MMM d');
      
      const projectsExisted = projects.filter(p => ensureDate(p.createdAt) <= date);
      
      const completedCount = projectsExisted.filter(p => {
        if (p.progress < 100) return false;
        const compDate = p.completedAt ? ensureDate(p.completedAt) : ensureDate(p.createdAt);
        return compDate <= date;
      }).length;
      
      const activeCount = projectsExisted.filter(p => 
        p.progress > 0 && p.progress < 100
      ).length;
      
      const idleCount = projectsExisted.filter(p => 
        p.progress === 0
      ).length;

      return {
        name: dateStr,
        Current: activeCount,
        Completed: completedCount,
        Remaining: idleCount,
      };
    });
  }, [projects, user]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
    return xp.toString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-purple-500/30 rounded-3xl overflow-y-auto shadow-2xl dark:shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            {/* Header / Banner - Dynamic Theme Style */}
            <div className={`h-32 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-black' : 'bg-sky-400'}`}>
              {theme === 'dark' ? (
                <>
                  {/* Dark Mode: Starry Night */}
                  <div className="absolute inset-0">
                    {/* Stars */}
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={`star-${i}`}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          width: `${Math.random() * 1.5 + 0.5}px`,
                          height: `${Math.random() * 1.5 + 0.5}px`,
                          animationDelay: `${Math.random() * 5}s`,
                          opacity: Math.random() * 0.7 + 0.3
                        }}
                      />
                    ))}
                    {/* Nebula Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.15),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_60%)]" />
                  </div>
                </>
              ) : (
                <>
                  {/* Light Mode: Blue Sky with Clouds */}
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-300">
                    {/* Clouds */}
                    <div className="absolute top-4 left-[10%] w-24 h-12 bg-white/60 rounded-full blur-xl animate-[pulse_6s_infinite_ease-in-out]" />
                    <div className="absolute top-8 right-[15%] w-32 h-16 bg-white/50 rounded-full blur-2xl animate-[pulse_8s_infinite_ease-in-out_1s]" />
                    <div className="absolute top-12 left-[40%] w-20 h-10 bg-white/40 rounded-full blur-lg animate-pulse" />
                    {/* Sun Flare */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl" />
                  </div>
                </>
              )}

              {/* Bottom Mist / Nebulae Transition */}
              <div className={`absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t to-transparent opacity-60 ${theme === 'dark' ? 'from-black' : 'from-sky-100'}`} />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8 -mt-12 relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  {/* Einstein Ring / Avatar Halo Effect */}
                  <div className="absolute -inset-4 z-0 pointer-events-none scale-110">
                    {theme === 'dark' ? (
                      <>
                        {/* Dark Mode: Cosmic Purple Ring */}
                        <div className="absolute inset-0 rounded-full border border-purple-500/20 blur-[4px] animate-[ping_4s_linear_infinite]" />
                        <div className="absolute inset-2 rounded-full border-2 border-white shadow-[0_0_25px_rgba(168,85,247,1),inset_0_0_15px_rgba(168,85,247,0.8)]" />
                        <div className="absolute inset-0 rounded-full border-[0.5px] border-purple-400/30 blur-[2px]" />
                      </>
                    ) : (
                      <>
                        {/* Light Mode: Sun-like Golden Halo */}
                        <div className="absolute inset-0 rounded-full border border-sky-400/20 blur-[6px] animate-[pulse_4s_infinite]" />
                        <div className="absolute inset-2 rounded-full border-2 border-white shadow-[0_0_20px_rgba(255,255,255,1),0_0_15px_rgba(14,165,233,0.3)]" />
                        <div className="absolute inset-0 rounded-full border-[0.5px] border-sky-300/30 blur-[2px]" />
                      </>
                    )}
                  </div>

                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=6b21a8&color=fff`}
                    alt="Profile"
                    className={`relative w-24 h-24 rounded-full border-4 object-cover transition-colors duration-500 ${theme === 'dark' ? 'border-gray-900' : 'border-white shadow-lg'}`}
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-purple-600 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-white">
                    {user.displayName || 'Shadow Monarch'}
                  </h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
                  <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl flex flex-col items-center gap-0.5 transition-colors">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quests</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{loading ? '...' : questsCount}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl flex flex-col items-center gap-0.5 transition-colors">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total XP</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{loading ? '...' : formatXP(totalXP)}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl flex flex-col items-center gap-0.5 transition-colors">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Streak</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{bonusStatus.streak || 1} Days</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl flex flex-col items-center gap-0.5 transition-colors">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Daily Bonus</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">+{bonusStatus.todayBonusXP || 50} XP</span>
                  </div>
                </div>

                {/* Daily Bonus Quick Launcher */}
                <button
                  onClick={() => {
                    onClose();
                    openBonusModal();
                  }}
                  className="w-full mt-3 p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    7-Day Streak Rewards
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">View →</span>
                </button>

                {/* Overall Stats Toggle Section */}
                <div className="w-full mt-8">
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="w-full flex items-center justify-between p-4 bg-purple-600/5 hover:bg-purple-600/10 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest text-[10px] transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Overall Progression
                    </div>
                    {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {showStats && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50 dark:bg-black/20 rounded-b-2xl mt-px border-x border-b border-purple-500/10"
                      >
                        <div className="p-4 space-y-6">
                          {/* Mini Stats Badges */}
                          <div className="flex justify-between items-center px-2">
                            <div className="flex flex-col items-center">
                              <Layers className="w-4 h-4 text-purple-500 mb-1" />
                              <span className="text-[8px] font-bold text-gray-500 uppercase">Current</span>
                              <span className="text-xs font-black text-purple-600 dark:text-purple-400">{stats.current}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-300 dark:bg-white/10" />
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
                              <span className="text-[8px] font-bold text-gray-500 uppercase">Completed</span>
                              <span className="text-xs font-black text-green-600 dark:text-green-400">{stats.completed}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-300 dark:bg-white/10" />
                            <div className="flex flex-col items-center">
                              <Clock className="w-4 h-4 text-red-500 mb-1" />
                              <span className="text-[8px] font-bold text-gray-500 uppercase">Remaining</span>
                              <span className="text-xs font-black text-red-600 dark:text-red-400">{stats.remaining}</span>
                            </div>
                          </div>

                          {/* 2D Line Chart Track */}
                          <div className="h-48 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 10 }}>
                                <defs>
                                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} opacity={0.5} />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false}
                                  tick={{ fontSize: 9, fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontWeight: 'bold' }}
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db', strokeWidth: 1 }} 
                                  tickLine={false} 
                                  tick={{ fontSize: 9, fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontWeight: 'bold' }}
                                  domain={[0, 'auto']}
                                  allowDecimals={false}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff', 
                                    border: '1px solid #c084fc',
                                    borderRadius: '16px',
                                    fontSize: '11px',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                  }}
                                  itemStyle={{ padding: '2px 0' }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="Remaining" 
                                  stroke="#ef4444" 
                                  strokeWidth={3}
                                  fillOpacity={0.4} 
                                  fill="url(#colorRemaining)" 
                                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: theme === 'dark' ? '#111827' : '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="Current" 
                                  stroke="#8b5cf6" 
                                  strokeWidth={3}
                                  fillOpacity={0.4} 
                                  fill="url(#colorCurrent)" 
                                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: theme === 'dark' ? '#111827' : '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="Completed" 
                                  stroke="#10b981" 
                                  strokeWidth={3}
                                  fillOpacity={0.4} 
                                  fill="url(#colorCompleted)" 
                                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: theme === 'dark' ? '#111827' : '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="flex justify-center gap-6 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Current</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Remaining</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Details List */}
                <div className="w-full mt-4 space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl transition-colors">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl transition-colors">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Access</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'MMM dd, yyyy') : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full mt-8 pt-6 border-t border-white/5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-500 font-black uppercase tracking-widest text-xs transition-all group"
                  >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Terminate Session
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
