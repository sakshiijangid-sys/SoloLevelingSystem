import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Trophy, Shield, Star, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  if (user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)] mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-b from-gray-900 to-purple-600 dark:from-white dark:to-purple-500 bg-clip-text text-transparent">
            Solo Leveling System
          </h1>
          <p className="text-purple-600 dark:text-purple-300 font-mono tracking-widest uppercase text-sm">
            System Initialization Required
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 rounded-3xl p-8 backdrop-blur-xl space-y-8 shadow-2xl transition-colors">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-purple-500/5 rounded-2xl border border-gray-100 dark:border-purple-500/10">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Secure Login</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your data is linked to your account.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-purple-500/5 rounded-2xl border border-gray-100 dark:border-purple-500/10">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Persistent Progress</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Old users get their projects back instantly.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-600 dark:text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                SIGN IN WITH GOOGLE
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest leading-relaxed">
            By initializing the system, you agree to the terms of service and privacy policy.
          </p>
        </div>

        <div className="flex justify-center gap-8 opacity-50">
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Fast</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Reliable</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
