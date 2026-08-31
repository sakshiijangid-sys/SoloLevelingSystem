import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { X, Send, Sparkles, User, Loader2, Globe, History, ChevronLeft, Calendar, Zap, Sword, AlertCircle, Key, Trash2, CheckCircle2 } from 'lucide-react';
import RobotIcon from './RobotIcon';
import { chatWithAI, getApiKey, setCustomApiKey } from '../services/geminiService';
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
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [keySavedNotice, setKeySavedNotice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isQuestPage = location.pathname.includes('/project/');
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : "Adventurer");

  const hasConfiguredKey = Boolean(getApiKey());

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
            ? `Hey ${userName}! 🌟 Need help in organising tasks? I'm your Solo Leveling System, here to help you optimize your quest board and crush those objectives!`
            : `Hey ${userName}! 🌟 Ready to level up? I'm your Solo Leveling System, here to help you crush your quests and conquer your roadmap! What's our first quest?`;          
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  // Handle auto-hide auth notice
  useEffect(() => {
    if (showAuthNotice) {
      const timer = setTimeout(() => setShowAuthNotice(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAuthNotice]);

  const handleSaveApiKey = () => {
    setCustomApiKey(customKeyInput);
    setKeySavedNotice(true);
    setTimeout(() => {
      setKeySavedNotice(false);
      setShowKeyModal(false);
    }, 1200);
  };

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

      // Handle Function Calls
      if (aiResponse.functionCalls) {
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
        errorMsg = "⚠️ **Oracle Key Required**\n\nThe Gemini API Key is missing or invalid in your live deployment.\n\nClick the 🔑 **API Key icon** at the top right of this chat window to paste your Gemini API key, or set `GEMINI_API_KEY` in your Vercel Project Settings.";
      } else if (errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota")) {
        errorMsg = "⏳ **Oracle Cooldown**\n\nThe AI quota limit was temporarily reached. Please wait a few moments and try your request again.";
      } else if (errString.includes("400") || errString.includes("INVALID_ARGUMENT")) {
        errorMsg = "⚠️ **Communication Signal Mismatch**\n\nThe message history was reset. Please try sending your request again.";
      } else {
        errorMsg = `⚠️ **Oracle Connection Notice**\n\n${errString.slice(0, 150)}\n\nYou can configure your API Key using the 🔑 key icon above.`;
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
            className="mb-4 w-[350px] md:w-[450px] h-[600px] max-h-[80vh] bg-white dark:bg-black border-2 border-gray-200 dark:border-purple-500/30 rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col transition-colors duration-300"
          >
            {/* Chat Header */}
            <div className="p-4 bg-purple-600 flex items-center justify-between border-b-2 border-purple-400">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center">
                  <RobotIcon className="w-10 h-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <History className="w-2.5 h-2.5 text-purple-200/50" />
                    <div className="text-xs font-black uppercase tracking-widest text-purple-200 leading-none">Learning Helper</div>
                  </div>
                  <div className="text-lg font-black text-white italic leading-none">Solo Leveling System</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setCustomKeyInput(getApiKey());
                    setShowKeyModal(!showKeyModal);
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-colors relative",
                    showKeyModal ? "bg-black/40 text-purple-200" : "hover:bg-black/20 text-white/70 hover:text-white"
                  )}
                  title="Configure Gemini API Key"
                >
                  <Key className="w-5 h-5" />
                  {!hasConfiguredKey && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                  )}
                </button>
                <button
                  onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    view === 'history' ? "bg-black/40 text-purple-400" : "hover:bg-black/20 text-white/70 hover:text-white"
                  )}
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* API Key Configuration Overlay Modal */}
            <AnimatePresence>
              {showKeyModal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-900 border-b border-purple-500/30 p-4 text-white z-20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <Key className="w-4 h-4 text-purple-400" />
                      <span>Gemini API Key Configuration</span>
                    </div>
                    <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-white text-xs">
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-300 mb-3 leading-tight">
                    Enter your Google AI Studio API Key to enable AI responses across any deployment:
                  </p>
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      className="w-full text-xs bg-black/60 border border-purple-500/40 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-400 hover:underline"
                      >
                        Get free API key ↗
                      </a>
                      <button
                        onClick={handleSaveApiKey}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        {keySavedNotice ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                            Saved!
                          </>
                        ) : (
                          "Save Key"
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
                    >
                      {isHistoryLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-400/50 italic animate-pulse">
                            Loading your messages...
                          </p>
                        </div>
                      ) : chatError ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500/80 italic">
                            {chatError}
                          </p>
                          <button 
                            onClick={() => window.location.reload()}
                            className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-400 underline"
                          >
                            Restore Connection
                          </button>
                        </div>
                      ) : (
                        <>
                          {messages.map((m, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "flex flex-col max-w-[85%] space-y-1",
                                m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {m.role === 'model' ? (
                                   <RobotIcon className="w-4 h-4" />
                                ) : (
                                   <User className="w-3 h-3 text-blue-400" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                  {m.role === 'model' ? "Guide" : "Me"}
                                </span>
                              </div>
                              <div className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed border shadow-sm transition-colors",
                                m.role === 'user' 
                                  ? "bg-purple-600 text-white border-purple-400 font-bold" 
                                  : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-white/10"
                              )}>
                                <div className={cn("markdown-body prose prose-sm max-w-none transition-colors", m.role === 'model' ? "dark:prose-invert" : "prose-invert")}>
                                  <Markdown>{m.text}</Markdown>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {isLoading && (
                        <div className="flex flex-col mr-auto items-start max-w-[85%] space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Consulting Oracle...</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-white/40 animate-pulse" />
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-purple-500/20 transition-colors">
                      <div className="mb-3">
                        <button
                          onClick={startQuestFlow}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-600/5 dark:bg-purple-500/10 hover:bg-purple-600/10 dark:hover:bg-purple-500/20 border border-purple-500/10 dark:border-purple-500/30 rounded-xl text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all group disabled:opacity-50"
                        >
                          <Sword className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                          Start New Quest
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder={isQuestPage ? "Ask how to finish your tasks..." : "Ask how to start or learn something..."}
                          className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 pr-12 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                        <button
                          onClick={() => handleSend()}
                          disabled={!input.trim() || isLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-600 dark:text-purple-500 hover:text-purple-400 disabled:opacity-30 transition-colors"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between px-1">
                        <span className="text-[8px] font-mono text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Powered by Gemini AI
                        </span>
                        {!hasConfiguredKey && (
                          <button
                            onClick={() => setShowKeyModal(true)}
                            className="text-[9px] text-amber-500 hover:underline font-bold flex items-center gap-0.5"
                          >
                            <Key className="w-2.5 h-2.5" />
                            Key Setup
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 overflow-y-auto p-6 bg-zinc-950 custom-scrollbar"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Previous Chats</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleClearHistory}
                          className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                          title="Clear chat history"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                        <button 
                          onClick={() => setView('chat')}
                          className="text-[10px] uppercase font-black tracking-tighter text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          Back
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8">
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
                          <div className="absolute -left-1.5 top-0 w-3 h-3 bg-zinc-950 border-2 border-purple-500 rounded-full" />
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-3 h-3 text-purple-500/50" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400">{date}</h4>
                          </div>
                          <div className="space-y-2">
                            {msgs.filter(m => m.role === 'user').map((m, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setView('chat');
                                }}
                                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all group"
                              >
                                <p className="text-xs text-gray-400 line-clamp-1 group-hover:text-gray-200">{m.text}</p>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-[8px] font-mono text-purple-400/30 uppercase">User Query</span>
                                  {m.createdAt && (
                                    <span className="text-[8px] font-mono text-gray-600">
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
                        <div className="text-center py-20">
                          <p className="text-gray-600 italic text-sm">No archives found in this timeline.</p>
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
            <div className="relative bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-red-400 font-bold text-sm">
              <div className="flex items-center gap-2">
                <span>Please sign in first to chat with Solo Leveling System</span>
              </div>
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-red-500 border-r-2 border-b-2 border-red-400 rotate-45" />
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
            <div className="relative bg-white text-black px-4 py-3 rounded-2xl shadow-2xl border-2 border-purple-500 font-bold text-sm">
              <div className="flex items-center gap-2">
                <RobotIcon className="w-5 h-5 animate-bounce" />
                <span>{isQuestPage ? "Need help in organising tasks? 🚀" : "Ready to level up? Let's max your skills! 🚀"}</span>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-500 rotate-45" />
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
        whileHover={{ scale: 1.1, x: 0, rotate: 0, opacity: 1 }}
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
          "w-20 h-20 flex items-center justify-center transition-all",
          isOpen 
            ? "bg-white dark:bg-black border-2 border-purple-500 dark:border-purple-500/50 rounded-full text-purple-600 dark:text-white shadow-2xl" 
            : "bg-transparent text-white"
        )}
      >
        {isOpen ? <X className="w-8 h-8" /> : <RobotIcon className="w-20 h-20" />}
      </motion.button>
    </div>
  );
}
