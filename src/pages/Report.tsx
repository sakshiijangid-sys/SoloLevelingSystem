import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, MonthlyReport, TaskLevel } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trophy, CheckCircle2, Circle, AlertCircle, Zap, Star } from 'lucide-react';
import { format, parseISO, isPast, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';

export default function Report() {
  const { id, month } = useParams<{ id: string; month: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const isExpired = project ? isPast(endOfDay(parseISO(project.targetDate))) : false;
  const isSuccessfullyCompleted = project ? project.progress === 100 : false;
  const isFailed = project ? isExpired && project.progress < 100 : false;
  const isLocked = isSuccessfullyCompleted || isFailed;

  // Link project level to report levels automatically
  useEffect(() => {
    if (!project || !report || isLocked) return;

    const syncReportWithLevel = async () => {
      const currentReportLevels = report.levels.length;
      const projectLevel = project.level;
      let needsUpdate = false;
      let updatedLevels = [...report.levels];

      // 1. If project level is higher than report levels, add new levels
      if (projectLevel > currentReportLevels) {
        for (let i = currentReportLevels + 1; i <= projectLevel; i++) {
          updatedLevels.push({
            id: `${id}_LVL_${i}_${Date.now()}_${i}`,
            projectId: id!,
            name: `Level ${i}`,
            isCompleted: true,
            index: i
          });
        }
        needsUpdate = true;
      }

      // 2. Ensure all levels up to projectLevel are marked as completed, others not
      updatedLevels = updatedLevels.map(lvl => {
        // A level is completed if progress has passed its milestone
        // Level 1: 0%, Level 2: 20%, Level 3: 40%, Level 4: 60%, Level 5: 80%
        const milestoneGoal = (lvl.index - 1) * 20;
        const shouldBeCompleted = project.progress >= milestoneGoal || lvl.index < project.level;
        
        if (lvl.isCompleted !== shouldBeCompleted) {
          needsUpdate = true;
          return { ...lvl, isCompleted: shouldBeCompleted };
        }
        return lvl;
      });

      if (needsUpdate) {
        try {
          await updateDoc(doc(db, 'monthlyReports', report.id), {
            levels: updatedLevels
          });
        } catch (error) {
          console.error("Error syncing report with level:", error);
        }
      }
    };

    syncReportWithLevel();
  }, [project?.level, report?.id, id, isLocked]);

  useEffect(() => {
    if (authLoading || !id || !month || !user) return;

    const unsubProject = onSnapshot(doc(db, 'projects', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.userId !== user.uid) {
          navigate('/');
          return;
        }
        setProject({ id: docSnap.id, ...data } as Project);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projects/${id}`);
    });

    const reportId = `${id}_${month}`;
    const unsubReport = onSnapshot(doc(db, 'monthlyReports', reportId), (docSnap) => {
      if (docSnap.exists()) {
        setReport({ id: docSnap.id, ...docSnap.data() } as MonthlyReport);
      } else {
        // Initialize report if not exists
        const projectLevel = project?.level || 1;
        const initialLevels: TaskLevel[] = [];
        // Create levels up to at least 5 or the current project level
        const maxLevel = Math.max(5, projectLevel);
        
        for (let i = 1; i <= maxLevel; i++) {
          const milestoneGoal = (i - 1) * 20;
          const isCompleted = (project && project.progress >= milestoneGoal) || (i < projectLevel);
          
          initialLevels.push({
            id: `${id}_LVL_${i}_init`,
            projectId: id!,
            name: `Level ${i}`,
            isCompleted,
            index: i
          });
        }

        setDoc(doc(db, 'monthlyReports', reportId), {
          projectId: id,
          month,
          levels: initialLevels,
          summary: `Monthly progress report for ${month}`
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `monthlyReports/${reportId}`));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `monthlyReports/${reportId}`);
    });

    return () => {
      unsubProject();
      unsubReport();
    };
  }, [id, month, user, authLoading, navigate]);

  if (loading || !project || !report) {
    return <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-purple-600 dark:text-purple-500 font-mono uppercase tracking-widest transition-colors duration-300">Loading report...</div>;
  }

  const completedCount = report.levels.filter(l => l.isCompleted).length;
  const progressPercentage = (completedCount / report.levels.length) * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-24 pb-12 px-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Quest
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-gray-900 via-purple-600 to-purple-500 dark:from-white dark:to-purple-500 bg-clip-text text-transparent">
            Monthly Report: {format(parseISO(`${month}-01`), 'MMMM yyyy')}
          </h1>
          <p className="text-gray-500 dark:text-gray-500 font-mono text-sm uppercase tracking-widest">
            Quest: {project.name} • Level: {project.level}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 rounded-3xl p-8 backdrop-blur-sm space-y-8 transition-colors">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                  Quest Progress
                </h2>
                <span className="text-purple-600 dark:text-purple-400 font-mono text-sm">{completedCount} / {report.levels.length} Levels</span>
              </div>

              <div className="space-y-4">
                {report.levels.map((level) => (
                  <div
                    key={level.id}
                    className={cn(
                      "w-full flex items-center justify-between p-6 rounded-2xl border transition-all",
                      level.isCompleted 
                        ? "bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                        : "bg-gray-50 dark:bg-black/50 border-gray-100 dark:border-gray-800"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-black italic",
                        level.isCompleted ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                      )}>
                        {level.index}
                      </div>
                      <div className="text-left">
                        <h3 className={cn(
                          "font-bold uppercase tracking-tight",
                          level.isCompleted ? "text-gray-900 dark:text-white" : "text-gray-400"
                        )}>
                          {level.name}
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest">
                          {level.isCompleted ? 'Step Finished' : 'Not Finished Yet'}
                        </p>
                      </div>
                    </div>
                    {level.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-purple-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-700" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 rounded-3xl p-6 backdrop-blur-sm space-y-6 transition-colors">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Star className="w-4 h-4" />
                Monthly Stats
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-100 dark:border-purple-500/10 transition-colors">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Completion Rate</div>
                  <div className="text-2xl font-black italic text-purple-600 dark:text-purple-400">{Math.round(progressPercentage)}%</div>
                </div>
                <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-100 dark:border-purple-500/10 transition-colors">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bonus Points Earned</div>
                  <div className="text-2xl font-black italic text-purple-600 dark:text-purple-400">+{completedCount * 200} Points</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-purple-500/10">
                <p className="text-[10px] text-gray-500 leading-relaxed italic text-center">
                  "Each level finished brings you closer to your quest. Great job!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
