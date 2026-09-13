import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { X, Send, Sparkles, User, Loader2, Globe, History, ChevronLeft, Calendar, Zap, Sword, AlertCircle, Trash2 } from 'lucide-react';
import RobotIcon from './RobotIcon';
import { chatWithAI } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';

interface Message {
  role: 'user' | 'model';
  text: string;
  createdAt?: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export default function AIChatbot() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestModelMsgRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isQuestPage = location.pathname.includes('/project/');
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : "Adventurer");

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid || null,
        email: user?.email || null,
        emailVerified: user?.emailVerified || null,
        isAnonymous: user?.isAnonymous || null,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    const handleInputActivity = (e: Event) => {
      if (e.type === 'focusin') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          setIsUserTyping(true);
        }
      } else if (e.type === 'focusout') {
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
            setIsUserTyping(false);
          }
        }, 100);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') return;
      
      setIsUserTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          setIsUserTyping(false);
        }
      }, 3000);
    };

    window.addEventListener('focusin', handleInputActivity);
    window.addEventListener('focusout', handleInputActivity);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('focusin', handleInputActivity);
      window.removeEventListener('focusout', handleInputActivity);
      window.removeEventListener('keydown', handleKeyDown);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setIsHistoryLoading(true);
      setChatError(null);
      const path = `users/${user.uid}/chatHistory`;
      try {
        const q = query(
          collection(db, path),
          orderBy('createdAt', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const history: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          history.push({
            role: data.role as 'user' | 'model',
            text: data.text,
            createdAt: data.createdAt
          });
        });
        
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Fallback greeting if no history
          const greeting = isQuestPage 
            ? `Hey ${userName}! 🌟 Need help organizing your quest tasks or daily strategy? I'm your Solo Leveling System guide, here to help you level up!`
            : `Hey ${userName}! 🌟 Welcome to the Solo Leveling System. I'm your AI guide! How can I assist you on your journey today?`;          
          const initialGreeting: Message = { role: 'model', text: greeting };
          setMessages([initialGreeting]);
          
          // Optionally save initial greeting
          try {
            await addDoc(collection(db, path), {
              userId: user.uid,
              role: initialGreeting.role,
              text: initialGreeting.text,
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Failed to save initial greeting:", e);
          }
        }
      } catch (error) {
        console.error("Failed to load history:", error);
        setChatError("Archives locked or unreachable.");
      } finally {
        setIsHistoryLoading(false);
      }
    };

    if (!loading && user) {
      loadHistory();
    }
  }, [user, loading]);

  // Calculate offset relative to scroll container
  const getOffsetTopRelativeToContainer = (el: HTMLElement, container: HTMLElement): number => {
    let top = 0;
    let current: HTMLElement | null = el;
    while (current && current !== container) {
      top += current.offsetTop;
      current = current.offsetParent as HTMLElement | null;
    }
    return top;
  };

  useEffect(() => {
    if (!scrollRef.current) return;

    const lastMsg = messages[messages.length - 1];

    // Whenever an answer is received (last message is from model),
    // scroll so the START of the response is visible at the top,
    // allowing the user to read from the beginning and scroll down naturally.
    if (lastMsg?.role === 'model' && latestModelMsgRef.current) {
      const scrollContainer = scrollRef.current;
      const targetElement = latestModelMsgRef.current;

      const scrollToStart = () => {
        if (!scrollContainer || !targetElement) return;
        const relativeTop = getOffsetTopRelativeToContainer(targetElement, scrollContainer);
        scrollContainer.scrollTo({
          top: Math.max(0, relativeTop - 12),
          behavior: 'smooth'
        });
      };

      // Call immediately, and again on slight delays to account for markdown DOM expansion
      scrollToStart();
      const t1 = setTimeout(scrollToStart, 60);
      const t2 = setTimeout(scrollToStart, 180);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      // While user is typing, sending messages, or waiting with the thinking indicator,
      // scroll to bottom so the user's message and loading spinner are in full view
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isOpen, isLoading]);

  // Handle auto-hide auth notice
  useEffect(() => {
    if (showAuthNotice) {
      const timer = setTimeout(() => setShowAuthNotice(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAuthNotice]);

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      const chatPath = `users/${user.uid}/chatHistory`;
      const q = query(collection(db, chatPath));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, chatPath, d.id)));
      await Promise.all(deletePromises);
      
      const greeting = `Hey ${userName}! Ready to start fresh? What would you like to level up today?`;
      setMessages([{ role: 'model', text: greeting }]);
      setView('chat');
    } catch (e) {
      console.error("Failed to clear chat history:", e);
    }
  };

  const handleSend = async (forcedMessage?: string) => {
    if ((!input.trim() && !forcedMessage) || isLoading || !user) return;

    const userMessage = forcedMessage || input.trim();
    const chatPath = `users/${user.uid}/chatHistory`;
    
    if (!forcedMessage) setInput('');
    const newUserMsg: Message = { role: 'user', text: userMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Save user message to Firestore
      try {
        await addDoc(collection(db, chatPath), {
          userId: user.uid,
          role: newUserMsg.role,
          text: newUserMsg.text,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to save user message:", e);
      }

      // Filter out error strings and non-dialogue system messages from LLM history
      const history = messages
        .filter(m => !m.text.includes("Oracle Connection Configuration") && !m.text.includes("Forgive me, the magical connection is weak"))
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const aiResponse = await chatWithAI(userMessage, history, userName);
      const botText = aiResponse.text || "Quest logic activated.";
      const newAiMsg: Message = { role: 'model', text: botText };
      setMessages(prev => [...prev, newAiMsg]);

      // Handle Function Calls (only if valid functionCalls returned and not a greeting)
      const isGreeting = /^(hi|hello|hey|greetings|hola|sup|yo|good\s+(morning|afternoon|evening|day))\b[!.?]*$/i.test(userMessage.trim());
      if (aiResponse.functionCalls && !isGreeting) {
        for (const call of aiResponse.functionCalls) {
          if (call.name === 'createQuestWithTasks') {
            const { questName, description, startDate, endDate, tasks } = call.args as any;
            
            try {
              // 1. Create Project
              const projectsPath = 'projects';
              
              const projectRef = await addDoc(collection(db, projectsPath), {
                userId: user.uid,
                name: questName,
                description: description,
                goal: description.slice(0, 50),
                startDate: startDate,
                targetDate: endDate,
                status: "active",
                progress: 0,
                xp: 0,
                level: 1,
                lastProcessed: serverTimestamp(),
                createdAt: serverTimestamp(),
              });

              // 2. Add Tasks
              const baseDate = new Date(startDate);
              for (const task of tasks) {
                const tasksPath = `projects/${projectRef.id}/dailyTasks`;
                const taskDate = new Date(baseDate);
                taskDate.setDate(taskDate.getDate() + (task.dayNumber || 0));
                
                await addDoc(collection(db, tasksPath), {
                  projectId: projectRef.id,
                  userId: user.uid,
                  text: task.text,
                  completed: false,
                  date: format(taskDate, 'yyyy-MM-dd'),
                  createdAt: serverTimestamp(),
                  reminderTime: task.reminderTime || null
                });
              }
            } catch (fsError) {
              handleFirestoreError(fsError, OperationType.WRITE, `projects/${questName}`);
            }
          }
        }
      }

      // Save AI response to Firestore
      try {
        await addDoc(collection(db, chatPath), {
          userId: user.uid,
          role: newAiMsg.role,
          text: newAiMsg.text,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to save AI response:", e);
      }
    } catch (error: any) {
      console.error("Chat error details:", error);
      let errorMsg = "Forgive me, the magical connection is weak. I could not reach the Oracle. Please try again later.";
      
      const errString = error?.message || String(error || '');
      if (
        errString.includes("GEMINI_API_KEY_MISSING") || 
        errString.includes("API key not valid") || 
        errString.includes("apiKey is required") || 
        errString.includes("403") || 
        errString.includes("API_KEY_INVALID")
      ) {
        errorMsg = "⚠️ **Oracle Key Required**\n\nThe Gemini API Key is missing or invalid. Please check your environment variables.";
      } else if (errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota")) {
        errorMsg = "⏳ **Oracle Cooldown**\n\nThe AI quota limit was temporarily reached. Please wait a few moments and try your request again.";
      } else if (errString.includes("400") || errString.includes("INVALID_ARGUMENT")) {
        errorMsg = "⚠️ **Communication Signal Mismatch**\n\nThe message history was reset. Please try sending your request again.";
      } else {
        errorMsg = `⚠️ **Oracle Connection Notice**\n\n${errString.slice(0, 150)}`;
      }
      
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuestFlow = () => {
    const greeting = "Hi! I can help you reach a new quest. What would you like to learn or do? Just tell me the topic!";
    const botMsg: Message = { role: 'model', text: greeting };
    setMessages(prev => [...prev, botMsg]);
    
    if (user) {
      addDoc(collection(db, `users/${user.uid}/chatHistory`), {
        userId: user.uid,
        role: botMsg.role,
        text: botMsg.text,
        createdAt: serverTimestamp()
      }).catch(console.error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans chatbot-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] md:w-[450px] h-[600px] max-h-[80vh] bg-white dark:bg-zinc-950 border border-gray-200 dark:border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl dark:shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col transition-colors duration-300 backdrop-blur-md"
          >
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-b border-gray-100 dark:border-white/10 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 rounded-xl flex items-center justify-center">
                  <RobotIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 leading-none">Learning Assistant</div>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">Solo Leveling Oracle</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    view === 'history' 
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400" 
                      : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                  title={view === 'chat' ? "History" : "Back to Chat"}
                >
                  <History className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* View Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <AnimatePresence mode="wait">
                {view === 'chat' ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    {/* Messages Area */}
                    <div 
                      ref={scrollRef}
                      className="relative flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/70 dark:bg-zinc-950/60 transition-colors"
                    >
                      {isHistoryLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 animate-pulse">
                            Loading your messages...
                          </p>
                        </div>
                      ) : chatError ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {chatError}
                          </p>
                          <button 
                            onClick={() => window.location.reload()}
                            className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Restore Connection
                          </button>
                        </div>
                      ) : (
                        <>
                          {messages.map((m, i) => {
                            const isLatestModel = i === messages.length - 1 && m.role === 'model';
                            return (
                              <div 
                                key={i} 
                                ref={isLatestModel ? latestModelMsgRef : null}
                                className={cn(
                                  "flex flex-col max-w-[85%] space-y-1",
                                  m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                              >
                                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                  {m.role === 'model' ? (
                                     <RobotIcon className="w-3.5 h-3.5" />
                                  ) : (
                                     <User className="w-3 h-3 text-purple-500" />
                                  )}
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    {m.role === 'model' ? "Guide" : "You"}
                                  </span>
                                </div>
                                <div className={cn(
                                  "p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all",
                                  m.role === 'user' 
                                    ? "bg-purple-600 text-white font-medium shadow-sm" 
                                    : "bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 border border-gray-200/80 dark:border-white/10 shadow-sm"
                                )}>
                                  <div className={cn("markdown-body prose prose-sm max-w-none transition-colors", m.role === 'model' ? "dark:prose-invert" : "prose-invert")}>
                                    <Markdown>{m.text}</Markdown>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      {isLoading && (
                        <div className="flex flex-col mr-auto items-start max-w-[85%] space-y-1">
                          <div className="flex items-center gap-1.5 mb-0.5 px-1">
                            <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 italic">Thinking...</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-white/10 flex items-center gap-2 shadow-sm">
                            <Globe className="w-4 h-4 text-purple-500/50 animate-pulse" />
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-t border-gray-100 dark:border-white/10 transition-colors">
                      {/* Quick Action Prompt Chips */}
                      <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        <button
                          onClick={startQuestFlow}
                          disabled={isLoading}
                          className="flex-shrink-0 flex items-center gap-1.5 py-1 px-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-700 dark:text-purple-300 text-[11px] font-semibold transition-all group disabled:opacity-50"
                        >
                          <Sword className="w-3 h-3 group-hover:rotate-12 transition-transform text-purple-500" />
                          <span>New Quest</span>
                        </button>
                        <button
                          onClick={() => handleSend("How does the Solo Leveling System app work? Give me a complete guide and instructions on all features.")}
                          disabled={isLoading}
                          className="flex-shrink-0 flex items-center gap-1.5 py-1 px-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-300 text-[11px] font-semibold transition-all disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span>App Guide</span>
                        </button>
                        <button
                          onClick={() => handleSend("How do XP, Leveling up, and Hunter Ranks work in this app?")}
                          disabled={isLoading}
                          className="flex-shrink-0 flex items-center gap-1.5 py-1 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-[11px] font-semibold transition-all disabled:opacity-50"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>XP & Ranks</span>
                        </button>
                        <button
                          onClick={() => handleSend("Give me practical tips and instructions to stay consistent with my daily quest tasks and habits.")}
                          disabled={isLoading}
                          className="flex-shrink-0 flex items-center gap-1.5 py-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold transition-all disabled:opacity-50"
                        >
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          <span>Habit Tips</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder={isQuestPage ? "Ask how to finish your tasks..." : "Ask how to start or learn something..."}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-2.5 sm:py-3 px-4 pr-12 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                        <button
                          onClick={() => handleSend()}
                          disabled={!input.trim() || isLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-30 transition-colors"
                        >
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between px-1">
                        <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Powered by Gemini AI
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-zinc-950 custom-scrollbar transition-colors"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-500" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Previous Chats</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleClearHistory}
                          className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 transition-colors"
                          title="Clear chat history"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                        <button 
                          onClick={() => setView('chat')}
                          className="text-[10px] uppercase font-bold tracking-tight text-purple-600 dark:text-purple-400 hover:text-purple-500 flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          Back
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {Object.entries(
                        messages.reduce((groups: Record<string, Message[]>, message) => {
                          const date = message.createdAt 
                            ? (message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt))
                            : new Date();
                          
                          let dateLabel = format(date, 'MMM dd, yyyy');
                          if (isToday(date)) dateLabel = 'Today';
                          else if (isYesterday(date)) dateLabel = 'Yesterday';
                          
                          if (!groups[dateLabel]) groups[dateLabel] = [];
                          groups[dateLabel].push(message);
                          return groups;
                        }, {})
                      ).map(([date, msgs]) => (
                        <div key={date} className="relative pl-4 border-l border-purple-500/20">
                          <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white dark:bg-zinc-950 border-2 border-purple-500 rounded-full" />
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Calendar className="w-3 h-3 text-purple-500" />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">{date}</h4>
                          </div>
                          <div className="space-y-2">
                            {msgs.filter(m => m.role === 'user').map((m, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setView('chat');
                                }}
                                className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 hover:border-purple-500/30 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group"
                              >
                                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-300">{m.text}</p>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-[8px] font-mono text-gray-400 uppercase">User Query</span>
                                  {m.createdAt && (
                                    <span className="text-[8px] font-mono text-gray-500 dark:text-gray-400">
                                      {format(m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt), 'HH:mm')}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {messages.length === 0 && (
                        <div className="text-center py-16">
                          <p className="text-gray-400 dark:text-gray-500 italic text-xs">No archives found.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthNotice && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 mb-2 whitespace-nowrap"
          >
            <div className="relative bg-red-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-red-500 font-semibold text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span>Please sign in first to chat with Solo Leveling System</span>
              </div>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-red-600 border-r border-b border-red-500 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && showTooltip && !isUserTyping && !showAuthNotice && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 mb-2 whitespace-nowrap"
          >
            <div className="relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-4 py-2.5 rounded-2xl shadow-xl border border-gray-200 dark:border-purple-500/40 font-semibold text-xs sm:text-sm transition-colors">
              <div className="flex items-center gap-2">
                <RobotIcon className="w-5 h-5 animate-bounce" />
                <span>{isQuestPage ? "Need help organizing tasks? 🚀" : "Ready to level up? Let's max your skills! 🚀"}</span>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-zinc-900 border-r border-b border-gray-200 dark:border-purple-500/40 rotate-45 transition-colors" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        animate={{
          x: !isOpen && isUserTyping ? 65 : 0,
          rotate: !isOpen && isUserTyping ? -15 : 0,
          opacity: !isOpen && isUserTyping ? 0.6 : 1,
          scale: !isOpen && isUserTyping ? 0.9 : 1,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25,
          opacity: { duration: 0.2 }
        }}
        whileHover={{ scale: 1.15, x: 0, rotate: 6, opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (!user) {
            setShowAuthNotice(true);
            setShowTooltip(false);
            return;
          }
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className={cn(
          "relative w-20 h-20 flex items-center justify-center transition-all group",
          isOpen 
            ? "bg-white dark:bg-black border-2 border-purple-500 dark:border-purple-500/50 rounded-full text-purple-600 dark:text-white shadow-2xl" 
            : "bg-transparent text-white"
        )}
      >
        {!isOpen && (
          <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full scale-75 group-hover:scale-110 group-hover:bg-purple-500/50 transition-all duration-300 pointer-events-none" />
        )}
        {isOpen ? <X className="w-8 h-8" /> : <RobotIcon className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(147,51,234,0.35)] relative z-10 transition-transform group-hover:scale-105" />}
      </motion.button>
    </div>
  );
}
