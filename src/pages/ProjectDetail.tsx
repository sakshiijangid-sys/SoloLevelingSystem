import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, updateDoc, collection, query, where, addDoc, getDocs, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, DailyCheck, DailyTask } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { GoogleGenAI } from "@google/genai";

import RPGProgressBar from '../components/RPGProgressBar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Trophy, 
  TrendingUp, 
  FileText,
  ChevronRight,
  AlertCircle,
  Zap,
  Plus,
  Trash2,
  Sword,
  Target,
  Layout,
  Maximize2,
  Minimize2,
  Clock,
  AlarmClock,
  Bot
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isPast, parseISO, endOfDay, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { cn } from '../lib/utils';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Date | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout| null>(null);
  const [systemTip, setSystemTip] = useState<string>("Working on your quests every day helps you finish them faster. Keep it up!");
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [showScreenshotNotice, setShowScreenshotNotice] = useState(false);

  // Handle auto-hide screenshot notice
  useEffect(() => {
    if (showScreenshotNotice) {
      const timer = setTimeout(() => setShowScreenshotNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showScreenshotNotice]);

  useEffect(() => {
    if (isScreenshotMode) {
      document.body.classList.add('screenshot-mode');
    } else {
      document.body.classList.remove('screenshot-mode');
    }
    return () => document.body.classList.remove('screenshot-mode');
  }, [isScreenshotMode]);

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: DailyTask[] } = {};
    dailyTasks.forEach(task => {
      if (!task.date) return;
      if (!groups[task.date]) groups[task.date] = [];
      groups[task.date].push(task);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dailyTasks]);

  useEffect(() => {
    if (authLoading || !id || !user) return;

    const unsubProject = onSnapshot(doc(db, 'projects', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.userId !== user.uid) {
          navigate('/');
          return;
        }
        setProject({ id: docSnap.id, ...data } as Project);
      } else {
        navigate('/');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projects/${id}`);
    });

    const qTasks = query(
      collection(db, 'projects', id, 'dailyTasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setDailyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `projects/${id}/dailyTasks`);
    });

    const q = query(
      collection(db, 'dailyChecks'),
      where('projectId', '==', id),
      where('userId', '==', user.uid)
    );

    const unsubChecks = onSnapshot(q, (snapshot) => {
      const checks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DailyCheck[];
      setDailyChecks(checks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `dailyChecks`);
    });

    return () => {
      unsubProject();
      unsubTasks();
      unsubChecks();
    };
  }, [id, user, authLoading, navigate]);

  useEffect(() => {
    if (!project || isGeneratingTip || systemTip !== "Working on your quests every day helps you finish them faster. Keep it up!") return;

    const generateTip = async () => {
      setIsGeneratingTip(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a helpful and simple assistant. Give one short, friendly, and very simple tip for someone working on a quest called "${project.name}". Use very simple words. No jargon. Do not use quotes. Max 15 words.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        if (response.text) {
          setSystemTip(response.text.trim());
        }
      } catch (error) {
        console.error("Failed to generate system tip:", error);
      } finally {
        setIsGeneratingTip(false);
      }
    };

    generateTip();
  }, [project, systemTip, isGeneratingTip]);



  const isExpired = project ? isPast(endOfDay(parseISO(project.targetDate))) : false;
  const isSuccessfullyCompleted = project ? project.progress === 100 : false;
  const isFailed = project ? isExpired && project.progress < 100 : false;
  const isLocked = isSuccessfullyCompleted || isFailed;

  // Auto-tick logic: Detect when all tasks for a date are completed
  useEffect(() => {
    if (!project || !user || !id || isLocked) return;
    
    // Get all unique dates from dailyTasks
    const taskDates = [...new Set(dailyTasks.map(t => t.date))].filter((d): d is string => !!d);
    
    taskDates.forEach(async (dateStr) => {
      const dateTasks = dailyTasks.filter(t => t.date === dateStr);
      if (dateTasks.length === 0) return;

      const allCompleted = dateTasks.every(t => t.completed);
      const isCurrentlyChecked = dailyChecks.some(c => c.date === dateStr);

      // We only auto-tick for "today" or "past" to avoid future manipulation if that's a concern
      // But the request says "when specific tasks are completed at that date"
      // Auto-tick/un-tick logic
      const dateObj = parseISO(dateStr);
      if (!isToday(dateObj)) return; // Only automate for today to avoid confusion

      if (allCompleted && !isCurrentlyChecked) {
        toggleCheck(dateObj);
      } else if (!allCompleted && isCurrentlyChecked) {
        toggleCheck(dateObj);
      }
    });
  }, [dailyTasks, dailyChecks, project, user, id, isLocked]);

  const handleManualDateClick = (day: Date) => {
    if (isLocked) return;
    
    // Check if it's within project duration
    if (project) {
      const dayStr = format(day, 'yyyy-MM-dd');
      if (dayStr < project.startDate || dayStr > project.targetDate) {
        setSystemMessage("This date is outside the quest duration!");
        setTimeout(() => setSystemMessage(null), 3000);
        return;
      }
    }

    setSelectedDateTasks(day);
  };

  const addTask = async (e?: FormEvent, taskText?: string, dateStr?: string, reminderTime?: string) => {
    if (e) e.preventDefault();
    const textToUse = (taskText || newTaskText).trim();
    if (!textToUse || !id || !user || isLocked) return;

    try {
      const finalDate = dateStr || format(new Date(), 'yyyy-MM-dd');
      await addDoc(collection(db, 'projects', id, 'dailyTasks'), {
        projectId: id,
        userId: user.uid,
        text: textToUse,
        completed: false,
        createdAt: serverTimestamp(),
        date: finalDate,
        reminderTime: reminderTime || null,
        projectName: project.name
      });
      if (!taskText) setNewTaskText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${id}/dailyTasks`);
    }
  };

  const toggleTask = async (task: DailyTask) => {
    if (!id || isLocked) return;

    const taskDateStr = task.date || format(new Date(), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // We allow ticking off tasks for today or past days, but maybe user wants it strictly today
    // For now, let's keep it restricted to today as per previous rules, but inform user
    if (taskDateStr !== todayStr) {
      setSystemMessage("You can only finish tasks on the day they are scheduled for!");
      setTimeout(() => setSystemMessage(null), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, 'projects', id, 'dailyTasks', task.id), {
        completed: !task.completed
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}/dailyTasks/${task.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!id || isLocked) return;
    try {
      await deleteDoc(doc(db, 'projects', id, 'dailyTasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}/dailyTasks/${taskId}`);
    }
  };

  const editTask = async (taskId: string, newText: string) => {
    if (!id || !newText.trim() || isLocked) return;
    try {
      await updateDoc(doc(db, 'projects', id, 'dailyTasks', taskId), {
        text: newText.trim()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}/dailyTasks/${taskId}`);
    }
  };

  const updateTaskReminder = async (taskId: string, time: string | null) => {
    if (!id || isLocked) return;
    try {
      await updateDoc(doc(db, 'projects', id, 'dailyTasks', taskId), {
        reminderTime: time,
        userId: user?.uid, // Ensure userId is present on update too
        projectName: project.name
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}/dailyTasks/${taskId}`);
    }
  };

  const toggleCheck = async (date: Date) => {
    if (!project || !user || !id || isLocked) return;
    if (!isToday(date)) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const existingCheck = dailyChecks.find(c => c.date === dateStr);
    
    // Calculate total days in quest duration
    const totalDays = eachDayOfInterval({
      start: parseISO(project.startDate),
      end: parseISO(project.targetDate)
    }).length;

    try {
      if (existingCheck) {
        await deleteDoc(doc(db, 'dailyChecks', existingCheck.id));
        // Update project progress, XP, status and completedAt
        const newChecksCount = dailyChecks.length - 1;
        const newProgress = (newChecksCount / totalDays) * 100;
        const newXP = Math.max(0, project.xp - 50);
        
        // Ensure level respects progress down-scaling as well for consistency
        const newLevel = Math.max(1, Math.floor(newProgress / 20) + 1);
        
        await updateDoc(doc(db, 'projects', id), {
          progress: newProgress,
          xp: newXP,
          level: newLevel,
          status: newProgress >= 100 ? 'completed' : 'active',
          completedAt: null // Reset if removed
        });
      } else {
        await addDoc(collection(db, 'dailyChecks'), {
          projectId: id,
          userId: user.uid,
          date: dateStr,
          completed: true
        });
        
        // Update project progress, XP, status and completedAt
        const newChecksCount = dailyChecks.length + 1;
        const newProgress = (newChecksCount / totalDays) * 100;
        const newXP = project.xp + 50;
        
        // Calculate new level based on progress milestones (20% intervals)
        const completedMilestones = Math.floor(newProgress / 20);
        const milestoneLevel = completedMilestones + 1;
        const xpLevel = Math.floor(newXP / 1000) + 1;
        
        // Use the higher of progress-based or XP-based level
        const newLevel = Math.max(milestoneLevel, xpLevel);
        
        if (newLevel > project.level) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }

        await updateDoc(doc(db, 'projects', id), {
          progress: newProgress,
          xp: newXP,
          level: newLevel,
          status: newProgress >= 100 ? 'completed' : 'active',
          completedAt: newProgress >= 100 ? serverTimestamp() : null
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${id} or dailyChecks`);
    }
  };

  if (loading || !project) {
    return <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-purple-600 dark:text-purple-500 font-mono uppercase tracking-widest">Loading System Data...</div>;
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-24 pb-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 rounded-3xl p-4 sm:p-8 backdrop-blur-sm space-y-6 sm:space-y-8 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-gray-900 via-purple-600 to-purple-500 dark:from-white dark:to-purple-500 bg-clip-text text-transparent leading-tight">
                  {project.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">{project.description}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-[10px] sm:text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Current Level</div>
                <div className="text-2xl sm:text-3xl font-black italic text-purple-600 dark:text-purple-500 leading-none">Level {project.level}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-purple-500/10 p-4 rounded-2xl space-y-1 transition-colors">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">Start Date</div>
                <div className="text-sm font-mono text-purple-600 dark:text-purple-300">{project.startDate}</div>
              </div>
              <div className="bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-purple-500/10 p-4 rounded-2xl space-y-1 transition-colors">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">Target Date</div>
                <div className="text-sm font-mono text-purple-600 dark:text-purple-300">{project.targetDate}</div>
              </div>
            </div>

            <RPGProgressBar 
              value={project.progress} 
              max={100} 
              label="Progress" 
              className="py-4"
            />

            <div className="bg-purple-600/5 dark:bg-purple-600/10 border border-purple-500/10 dark:border-purple-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <Trophy className="text-white w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Main Quest</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white italic">{project.goal}</div>
                </div>
              </div>

              {isSuccessfullyCompleted ? (
                <div className="flex items-center gap-2 text-green-400 font-black italic uppercase tracking-widest text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Quest Finished
                </div>
              ) : isFailed ? (
                <div className="flex items-center gap-2 text-red-500 font-black italic uppercase tracking-widest text-sm">
                  <AlertCircle className="w-5 h-5" />
                  Quest Unfinished
                </div>
              ) : (
                <div className="flex items-center gap-2 text-purple-400 font-black italic uppercase tracking-widest text-sm">
                  <Zap className="w-5 h-5 animate-pulse" />
                  In Progress
                </div>
              )}
            </div>
          </div>

          {/* Monthly Reports Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-purple-500 rounded-full" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Monthly Reports</h2>
            </div>
            
            <Link 
              to={`/project/${id}/report/${format(currentMonth, 'yyyy-MM')}`}
              className="block bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 p-6 rounded-2xl hover:border-purple-600 dark:hover:border-purple-500 transition-all group shadow-sm hover:shadow-md dark:shadow-none"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center transition-colors">
                    <FileText className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {format(currentMonth, 'MMMM yyyy')} Report
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">View monthly progress levels and achievements</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar Calendar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 rounded-3xl p-6 backdrop-blur-sm space-y-6 transition-colors shadow-xl dark:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 sm:w-5 h-5 text-purple-600 dark:text-purple-500" />
                  Quest Log
                </h2>
                <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest mt-1">Track your progress</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => {
                    setIsScreenshotMode(true);
                    setShowScreenshotNotice(true);
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white transition-colors"
                  title="Screenshot Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <div className="text-center font-mono text-sm text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4">
              {format(currentMonth, 'MMMM yyyy')}
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isChecked = dailyChecks.some(c => c.date === dateStr);
                const isCurrentDay = isToday(day);

                return (
                  <div key={dateStr} className="flex flex-col gap-0.5 sm:gap-1">
                    <button
                      onClick={() => handleManualDateClick(day)}
                      disabled={isLocked}
                      className={cn(
                        "aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center transition-all border relative group overflow-hidden",
                        isChecked 
                          ? "bg-purple-600 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                          : "bg-gray-50 dark:bg-black/50 border-gray-100 dark:border-gray-800 hover:border-purple-500/50",
                        isCurrentDay && !isChecked && !isLocked && "border-purple-600/50 dark:border-purple-500/50 ring-1 ring-purple-600/30 dark:ring-purple-500/30",
                        isLocked && "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-900"
                      )}
                    >
                      <span className={cn(
                        "text-[8px] sm:text-[10px] font-mono mb-0.5",
                        isChecked ? "text-white" : "text-gray-400 dark:text-gray-500",
                        isCurrentDay && !isChecked && "text-purple-600 dark:text-purple-400"
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Task Indicators */}
                      <div className="flex gap-0.5 flex-wrap justify-center px-0.5 sm:px-1">
                        {dailyTasks
                          .filter(t => t.date === dateStr)
                          .slice(0, 3)
                          .map((t, idx) => (
                            <div 
                              key={t.id} 
                              className={cn(
                                "w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full",
                                t.completed ? "bg-green-500 dark:bg-green-400" : "bg-purple-500 dark:bg-purple-400"
                              )} 
                            />
                          ))}
                        {dailyTasks.filter(t => t.date === dateStr).length > 3 && (
                          <div className={cn("text-[5px] sm:text-[6px] font-bold", isChecked ? "text-white" : "text-gray-400")}>+</div>
                        )}
                      </div>

                      {isChecked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-white fill-purple-600" />
                        </motion.div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-purple-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Today's Steps</h3>
                </div>
                <span className="text-[8px] font-mono text-gray-500">{format(new Date(), 'yyyy-MM-dd')}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="+ New Step"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const val = input.value;
                        if (val.trim()) {
                          addTask(undefined, val.trim(), format(new Date(), 'yyyy-MM-dd'));
                          input.value = '';
                        }
                      }
                    }}
                    className="flex-1 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-purple-500/20 rounded-lg px-3 py-1.5 text-[10px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 font-bold italic transition-colors"
                  />
                </div>

                <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {dailyTasks
                    .filter(t => t.date === format(new Date(), 'yyyy-MM-dd'))
                    .map(task => (
                      <div key={task.id} className="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg group/item transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              onClick={() => toggleTask(task)}
                              className={cn(
                                "w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                task.completed ? "bg-purple-500 border-purple-400" : "border-purple-500/30"
                              )}
                            >
                              {task.completed && <CheckCircle2 className="w-2 h-2 text-white" />}
                            </button>
                            <input
                              type="text"
                              defaultValue={task.text}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== task.text) {
                                  editTask(task.id, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className={cn(
                                "bg-transparent border-none focus:ring-0 p-0 text-[10px] font-bold italic w-full truncate transition-colors",
                                task.completed ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="relative group/clock flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                              <AlarmClock className={cn("w-2.5 h-2.5", task.reminderTime ? "text-purple-400" : "text-gray-600")} />
                              <span className="text-[7px] font-black text-purple-400/80 uppercase tracking-tighter">Alert</span>
                              <input
                                type="time"
                                value={task.reminderTime || ""}
                                onChange={(e) => updateTaskReminder(task.id, e.target.value || null)}
                                className="bg-transparent border-none p-0 text-[8px] font-bold text-purple-400 focus:ring-0 w-12 cursor-pointer"
                              />
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-gray-600 hover:text-red-500 p-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Monthly Streak</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">{dailyChecks.filter(c => c.date.startsWith(format(currentMonth, 'yyyy-MM'))).length} Days</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Points Gained</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">+{dailyChecks.filter(c => c.date.startsWith(format(currentMonth, 'yyyy-MM'))).length * 50} Points</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/5 to-gray-50 dark:from-purple-900/20 dark:to-black border border-gray-200 dark:border-purple-500/20 rounded-3xl p-6 space-y-4 transition-colors">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
              Tip
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
              "{systemTip}"
            </p>
          </div>
        </div>
      </div>

      {/* Level Up Notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-purple-600 text-white px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.8)] border-2 border-white/20 flex items-center gap-4 transition-transform"
          >
            <Trophy className="w-8 h-8 animate-bounce" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em]">Update</div>
              <div className="text-2xl font-black italic uppercase tracking-tighter">Level Up! Keep it up.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Toast Message */}
      <AnimatePresence>
        {systemMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-white dark:bg-gray-900 border border-purple-500/50 text-gray-900 dark:text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-500" />
            <span className="text-sm font-bold uppercase tracking-widest italic">{systemMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Screenshot Notice */}
      <AnimatePresence>
        {showScreenshotNotice && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-8 z-[200] max-w-[280px]"
          >
            <div className="relative flex items-start gap-3 bg-purple-900/90 backdrop-blur-md border-2 border-purple-500/50 p-4 rounded-3xl shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              {/* Robot Icon Representation */}
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-400 shadow-inner">
                <Bot className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1 italic">Solo Leveling System</p>
                <p className="text-[11px] text-white font-bold leading-relaxed">
                  You can take a screenshot and put it in your study area to track learning offline! 📸
                </p>
              </div>

              {/* Chat Bubble Tail */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-purple-900 border-r-2 border-b-2 border-purple-500/50 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDateTasks && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDateTasks(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-purple-500/30 rounded-[32px] p-8 shadow-2xl dark:shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden transition-colors"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Target className="w-24 h-24 text-purple-600 dark:text-purple-500" />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-white">
                      Tasks for <span className="text-purple-600 dark:text-purple-500">{format(selectedDateTasks, 'MMM do')}</span>
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedDateTasks(null)}
                    className="text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-white p-2"
                  >
                    <Minimize2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {!isLocked && (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Add task for this date..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            const val = input.value;
                            if (val.trim() && selectedDateTasks) {
                              addTask(undefined, val.trim(), format(selectedDateTasks, 'yyyy-MM-dd'));
                              input.value = '';
                            }
                          }
                        }}
                        className="flex-1 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-purple-500/20 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 font-bold italic transition-colors"
                      />
                    </div>
                  )}

                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {dailyTasks
                      .filter(t => t.date === format(selectedDateTasks, 'yyyy-MM-dd'))
                      .map((task) => (
                        <div 
                          key={task.id}
                          className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-purple-500/10 rounded-xl group/item transition-colors"
                        >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => toggleTask(task)}
                              className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                task.completed ? "bg-purple-600 border-purple-500" : "border-gray-300 dark:border-purple-500/30",
                                task.date !== format(new Date(), 'yyyy-MM-dd') && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </button>
                            <input
                              type="text"
                              defaultValue={task.text}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== task.text) {
                                  editTask(task.id, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className={cn(
                                "bg-transparent border-none focus:ring-0 p-0 text-sm font-bold italic w-full transition-colors",
                                task.completed ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"
                              )}
                            />
                          </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1.5 rounded-lg border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                <AlarmClock className={cn("w-4 h-4", task.reminderTime ? "text-purple-400" : "text-gray-600")} />
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest hidden sm:inline">Alert</span>
                                <input
                                  type="time"
                                  value={task.reminderTime || ""}
                                  onChange={(e) => updateTaskReminder(task.id, e.target.value || null)}
                                  className="bg-transparent border-none p-0 text-xs font-bold text-purple-400 focus:ring-0 w-16 cursor-pointer"
                                />
                              </div>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-600 hover:text-red-500 p-1 opacity-100 group-hover/item:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {dailyTasks.filter(t => t.date === format(selectedDateTasks, 'yyyy-MM-dd')).length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase tracking-widest">
                        Objective Clear
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Screenshot Mode Overlay */}
      <AnimatePresence>
        {isScreenshotMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-hidden flex flex-col transition-colors duration-300"
          >
             {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white dark:bg-black border-b border-gray-200 dark:border-purple-500/30 relative z-20 transition-colors">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-white leading-none">
                    QUEST <span className="text-purple-600 dark:text-purple-500">BOARD</span>
                  </h2>
                  <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase tracking-[0.4em] mt-1">
                    Assign tasks to specific days // {format(currentMonth, 'MMMM yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-gray-100 dark:bg-purple-500/20 hover:bg-gray-200 dark:hover:bg-purple-500/40 border border-gray-200 dark:border-purple-500/40 rounded-lg text-gray-900 dark:text-white transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-gray-100 dark:bg-purple-500/20 hover:bg-gray-200 dark:hover:bg-purple-500/40 border border-gray-200 dark:border-purple-500/40 rounded-lg text-gray-900 dark:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => setIsScreenshotMode(false)}
                  className="bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/40 border border-red-500/20 dark:border-red-500/40 text-red-600 dark:text-red-500 p-2 rounded-lg transition-all"
                >
                  <Minimize2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 overflow-auto bg-white dark:bg-black p-2 sm:p-4 transition-colors">
              <div className="w-full h-full flex flex-col min-w-[320px]">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 gap-px border border-gray-200 dark:border-white/10 bg-gray-200 dark:bg-white/10 transition-colors">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 sm:py-3 text-center text-[8px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-gray-400 bg-white dark:bg-black transition-colors">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-white/10 flex-1 border-x border-b border-gray-200 dark:border-white/10 transition-colors">
                  {(() => {
                    const monthStart = startOfMonth(currentMonth);
                    const monthEnd = endOfMonth(currentMonth);
                    const calendarStart = startOfWeek(monthStart);
                    const calendarEnd = endOfWeek(monthEnd);
                    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                    return calendarDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const tasks = dailyTasks.filter(t => t.date === dateStr);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isTodayDate = isToday(day);

                      return (
                        <div 
                          key={dateStr}
                          className={cn(
                            "min-h-[100px] sm:min-h-[160px] p-2 sm:p-4 flex flex-col gap-1 sm:gap-3 transition-colors relative group/cell",
                            isCurrentMonth ? "bg-white dark:bg-black" : "bg-gray-50 dark:bg-black/90 opacity-40 dark:opacity-30",
                            isTodayDate && "ring-1 sm:ring-2 ring-inset ring-purple-600 dark:ring-purple-500"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-xs sm:text-base font-black italic tracking-tighter",
                              isTodayDate ? "text-purple-600 dark:text-purple-500" : "text-gray-400 dark:text-gray-300"
                            )}>
                              {format(day, 'd')}
                            </span>
                            {isTodayDate && (
                              <div className="text-[6px] sm:text-[8px] font-bold text-white bg-purple-600 px-1 sm:px-2 py-0.5 rounded uppercase tracking-widest hidden xs:block">
                                Active
                              </div>
                            )}
                          </div>

                          {/* Tasks List within Date Cell */}
                          <div className="flex-1 space-y-1 sm:space-y-2 overflow-y-auto custom-scrollbar max-h-[100px] sm:max-h-[140px]">
                            {tasks.map(task => (
                              <div 
                                key={task.id}
                                className={cn(
                                  "flex items-start gap-2 p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all",
                                  task.completed 
                                    ? "bg-purple-600/5 dark:bg-purple-900/10 border-purple-500/20 opacity-60" 
                                    : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5"
                                )}
                              >
                                <div className={cn(
                                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mt-1 shrink-0 relative transition-colors",
                                  task.completed ? "bg-purple-600 dark:bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-gray-300 dark:bg-gray-700"
                                )}>
                                  {task.reminderTime && (
                                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-400 rounded-full border border-white dark:border-black" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-[7px] sm:text-[9px] font-bold italic leading-tight break-words transition-colors",
                                    task.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
                                  )}>
                                    {task.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
