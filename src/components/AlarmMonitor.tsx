import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyTask } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, Sparkles } from 'lucide-react';
import ThreeRobotAlert from './ThreeRobotAlert';

export default function AlarmMonitor() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<DailyTask | null>(null);
  const [dismissedAlarms, setDismissedAlarms] = useState<string[]>([]);
  const [robotReady, setRobotReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Use collectionGroup to find all dailyTasks for this user across all projects
    const q = query(
      collectionGroup(db, 'dailyTasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        projectId: doc.ref.parent.parent?.id
      })) as DailyTask[];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const activeTasksForToday = taskData.filter(t => t.date === today && t.reminderTime && !t.completed);
      console.log(`[ALARM SYSTEM] Monitoring ${activeTasksForToday.length} active reminders for today.`);
      setTasks(activeTasksForToday);
    }, (error) => {
      console.warn("AlarmMonitor reminder listener status:", error?.message || error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleTestAlarm = (e: any) => {
      console.log("[ALARM SYSTEM] Received Test Alarm Trigger:", e.detail.text);
      setActiveAlarm({
        id: 'test_alarm_' + Date.now(),
        text: e.detail.text,
        completed: false,
        date: format(new Date(), 'yyyy-MM-dd'),
        reminderTime: format(new Date(), 'HH:mm'),
        userId: user?.uid || 'test',
        projectName: 'System Test'
      } as DailyTask);
    };

    window.addEventListener('TEST_ALARM_TRIGGER', handleTestAlarm);
    return () => window.removeEventListener('TEST_ALARM_TRIGGER', handleTestAlarm);
  }, [user]);

  const MOTIVATIONAL_QUOTES = [
    "You can do it! Let's get to work.",
    "Small steps every day make a big difference.",
    "Stay focused on your quest.",
    "Keep going, you're doing great!",
    "Success comes from taking action."
  ];

  const randomQuote = useRef(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  useEffect(() => {
    if (activeAlarm) {
      randomQuote.current = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    }
  }, [activeAlarm]);

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      if (tasks.length > 0 && tasks.some(t => t.reminderTime === currentTime)) {
         console.log(`[ALARM SYSTEM] Time match found at ${currentTime}. Checking dismissal status...`);
      }

      // Filter for active alarms that haven't been dismissed in this specific minute
      const triggerTask = tasks.find(t => {
        const isTimeMatch = t.reminderTime === currentTime;
        const isNotDismissed = !dismissedAlarms.includes(`${t.id}_${currentTime}`);
        const isNotActive = activeAlarm?.id !== t.id;
        return isTimeMatch && isNotDismissed && isNotActive;
      });

      if (triggerTask) {
        console.log("[ALARM SYSTEM] Alarm triggering for task:", triggerTask.text);
        setActiveAlarm(triggerTask);
      }
    };

    // Check more frequently for higher precision
    const interval = setInterval(checkAlarms, 2000); 
    return () => clearInterval(interval);
  }, [tasks, dismissedAlarms, activeAlarm]);

  const dismissAlarm = () => {
    if (activeAlarm) {
      const now = format(new Date(), 'HH:mm');
      setDismissedAlarms(prev => [...prev, activeAlarm.id + "_" + now]);
      setActiveAlarm(null);
    }
  };

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {activeAlarm && (
          <div className="fixed inset-0 z-[3000] flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start p-4 md:p-12 bg-black/95 backdrop-blur-2xl overflow-hidden">
            {/* 3D Three.js Animated Robot Character */}
            <div className="relative z-[3003] w-full max-w-[340px] md:max-w-[440px] h-[300px] md:h-[420px] flex items-center justify-center shrink-0">
              <div className="relative w-full h-full">
                {/* 3D Ambient Aura */}
                <div className="absolute inset-0 bg-purple-500/25 blur-3xl rounded-full pointer-events-none" />
                <ThreeRobotAlert 
                  onAnimationReady={() => setRobotReady(true)} 
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Impact Flash when robot "arrives" */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="absolute inset-0 bg-purple-500 z-[3001] pointer-events-none"
            />

            {/* Message Box (The "Speech Bubble") */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, x: 20, y: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ delay: 1.2, type: "spring", damping: 15 }}
              className="relative mb-6 md:mb-12 md:ml-4 flex-1 w-full max-w-lg z-[3004]"
            >
              <div className="relative bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                {/* Speech Arrow - Responsive placement */}
                <div className="absolute -top-3 left-10 md:top-auto md:bottom-10 md:-left-4 w-6 h-6 md:w-8 md:h-8 bg-zinc-900 border-t-2 border-l-2 md:border-t-0 md:border-b-2 border-purple-500/50 rotate-45" />

                <div className="relative">
                  <header className="mb-4 md:mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-purple-400 font-mono text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black">
                        Reminder
                      </h2>
                      <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase mt-1">
                        Time to Start
                      </h1>
                    </div>
                    <Zap className="w-6 h-6 md:w-8 md:h-8 text-purple-500 animate-pulse" />
                  </header>

                  <div className="mb-6 md:mb-8 space-y-4">
                    <div>
                      <p className="text-purple-400/50 text-[8px] md:text-[9px] uppercase tracking-widest font-bold mb-1 italic">Your Quest:</p>
                      <h3 className="text-xl md:text-2xl font-black text-white uppercase italic leading-tight">
                        {activeAlarm.text}
                      </h3>
                      <p className="text-purple-400/80 text-[10px] md:text-xs font-mono mt-1 uppercase tracking-widest">
                        Project: {activeAlarm.projectName || "Quest Helper"}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5 italic">
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                        "{randomQuote.current}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={dismissAlarm}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all uppercase text-[10px] md:text-xs tracking-widest shadow-[0_4px_20px_rgba(147,51,234,0.4)]"
                    >
                      <ShieldAlert className="w-5 h-5" />
                      I'm on it!
                    </motion.button>
                    
                    <button
                        onClick={() => setActiveAlarm(null)}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-500 font-bold py-4 px-6 rounded-xl text-[10px] md:text-xs uppercase tracking-widest transition-all"
                    >
                      Not now
                    </button>
                  </div>
                </div>

                {/* Footer Data */}
                <div className="mt-6 flex justify-between items-center text-[7px] md:text-[8px] font-mono text-purple-400/30 uppercase tracking-[0.2em]">
                  <span>A.I. Assistant // Running</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse delay-75" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
