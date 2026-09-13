import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Shield, Star, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReactNode | null>(null);
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
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          <div className="text-left space-y-2">
            <p className="font-bold">Domain Unauthorized!</p>
            <p>You must add this domain to your Firebase Console:</p>
            <ol className="list-decimal ml-5 text-sm space-y-1">
              <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
              <li>Go to <b>Authentication</b> &gt; <b>Settings</b> &gt; <b>Authorized domains</b></li>
              <li>Click <b>Add domain</b> and enter: <code className="bg-red-900/30 px-1 rounded">{window.location.hostname}</code></li>
            </ol>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="mt-2 w-full bg-purple-600 text-white text-[10px] py-2 rounded-lg font-bold"
            >
              OPEN IN SYSTEM BROWSER
            </button>
          </div>
        );
      } else if (err.message?.includes('missing initial state') || err.code === 'auth/popup-closed-by-user') {
        setError(
          <div className="text-left space-y-2">
            <p className="font-bold text-red-500">System Blocked by Browser</p>
            <p className="text-xs">Your app's browser is blocking the login state. Please use the button below to log in via your main phone browser:</p>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full bg-purple-600 text-white text-[10px] py-2 rounded-lg font-bold"
            >
              LOGIN IN STANDARD BROWSER (CHROME/SAFARI)
            </button>
            <div className="mt-2 p-2 bg-purple-500/10 rounded-lg text-[9px]">
              <p className="font-bold uppercase mb-1">Developer Tip:</p>
              <p>Make sure the "Google Sign-In" plugin is enabled in your Median.co dashboard.</p>
            </div>
          </div>
        );
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col items-center justify-center pt-28 sm:pt-32 pb-12 px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 sm:space-y-12 relative z-10"
      >
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-b from-gray-900 to-purple-600 dark:from-white dark:to-purple-500 bg-clip-text text-transparent mt-6 sm:mt-8 pt-2">
            Solo Leveling System
          </h1>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-purple-500/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 sm:space-y-8 shadow-2xl transition-colors">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-500/5 rounded-2xl border border-gray-100 dark:border-purple-500/10">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <p className="text-[10px] sm:text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Secure Login</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Your data is linked to your account.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-500/5 rounded-2xl border border-gray-100 dark:border-purple-500/10">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <p className="text-[10px] sm:text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Persistent Progress</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Old users get their projects back instantly.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 sm:p-4 rounded-xl text-red-600 dark:text-red-400 text-[10px] sm:text-xs font-mono">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
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
