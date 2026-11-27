import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, peekAuthReturnPath, consumeAuthReturnPath } from '../contexts/AuthContext';
import { Zap, Shield, Star, LogIn, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signInWithGoogle, user, loading: authLoading, verifying, authError, clearAuthError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<ReactNode | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const savedReturnPath = peekAuthReturnPath();
  const rawFrom = location.state?.from?.pathname || savedReturnPath || '/';
  const from = rawFrom === '/login' ? '/' : rawFrom;

  // Instant redirect as soon as auth settles and user is verified
  useEffect(() => {
    if (!authLoading && user) {
      const consumedPath = consumeAuthReturnPath();
      const rawTarget = location.state?.from?.pathname || consumedPath || '/';
      const target = rawTarget === '/login' ? '/' : rawTarget;
      navigate(target, { replace: true });
    }
  }, [authLoading, user, navigate, location.state]);

  // Surface any redirect/session error detected during startup hydration
  useEffect(() => {
    if (!authError) return;
    if (authError.includes('auth/unauthorized-domain')) {
      setLocalError(
        <div className="text-left space-y-2">
          <p className="font-bold">Domain Unauthorized</p>
          <p className="text-xs">Add this domain to Firebase Console under Authentication &gt; Settings &gt; Authorized domains:</p>
          <code className="block bg-red-900/20 px-2 py-1 rounded text-[11px] break-all">{window.location.hostname}</code>
        </div>
      );
    } else if (authError.includes('auth/access-denied') || authError.includes('auth/admin-restricted-operation') || authError.includes('auth/operation-not-allowed')) {
      setLocalError(
        <div className="text-left space-y-2">
          <p className="font-bold text-amber-600 dark:text-amber-400">Account Access Restricted by OAuth / Firebase</p>
          <p className="text-xs leading-relaxed">
            Google blocked sign-in for this email. In Google Cloud Console &gt; OAuth consent screen, switch Publishing status from <b>Testing</b> to <b>In production</b> (or add this email under Test users), and verify <b>Enable create (sign-up)</b> is enabled in Firebase Authentication settings.
          </p>
        </div>
      );
    } else if (authError.includes('REDIRECT_STATE_LOST') || authError.includes('missing initial state')) {
      setLocalError(
        <div className="text-left space-y-2">
          <p className="font-bold text-amber-600 dark:text-amber-400">Browser Blocked Redirect Session</p>
          <p className="text-xs leading-relaxed">
            Your browser cleared the Google redirect state on return. Allow pop-ups when prompted and tap <b>Sign in with Google</b> below, or open this page in Chrome/Safari.
          </p>
        </div>
      );
    } else {
      setLocalError(authError);
    }
  }, [authError]);

  const isVerifying = authLoading || verifying || isSubmitting || Boolean(user);

  const handleGoogleSignIn = async (popupOnly = false, forceRedirect = false) => {
    setIsSubmitting(true);
    setLocalError(null);
    clearAuthError();

    try {
      await signInWithGoogle(from, { popupOnly, forceRedirect });
      // Navigation happens automatically via the useEffect once user state is confirmed.
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/unauthorized-domain') {
        setLocalError(
          <div className="text-left space-y-2">
            <p className="font-bold">Domain Unauthorized</p>
            <p className="text-xs">Add this domain to Firebase Console under Authentication &gt; Settings &gt; Authorized domains:</p>
            <code className="block bg-red-900/20 px-2 py-1 rounded text-[11px] break-all">{window.location.hostname}</code>
          </div>
        );
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation' || code === 'auth/user-disabled' || msg.includes('access_denied')) {
        setLocalError(
          <div className="text-left space-y-2">
            <p className="font-bold text-amber-600 dark:text-amber-400">Account Access Restricted ({code || 'access_denied'})</p>
            <p className="text-xs leading-relaxed">
              This email cannot sign in yet. Ensure Firebase Auth allows new user sign-ups and your Google Cloud OAuth consent screen is set to <b>In production</b> (not <b>Testing</b>).
            </p>
          </div>
        );
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLocalError(
          <div className="text-left space-y-1.5">
            <p className="font-bold">Sign-in Popup Closed</p>
            <p className="text-xs leading-relaxed">
              The sign-in popup closed before completing. If Google showed <b>"Access blocked"</b> for another email, set your Google Cloud OAuth consent screen to <b>In production</b> (or add that email under Test users).
            </p>
          </div>
        );
      } else if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || msg.includes('POPUP_AND_REDIRECT_BLOCKED')) {
        setLocalError(
          <div className="text-left space-y-2.5">
            <p className="font-bold text-amber-600 dark:text-amber-400">Pop-up Blocked by Browser</p>
            <p className="text-xs leading-relaxed">
              Your browser blocked the Google sign-in pop-up. Allow pop-ups for <code className="px-1 py-0.5 rounded bg-black/20">{window.location.hostname}</code> and retry:
            </p>
            <button
              type="button"
              onClick={() => handleGoogleSignIn(true, false)}
              className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white text-xs py-2.5 px-4 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Retry Pop-up Sign-In
            </button>
            <button
              type="button"
              onClick={() => handleGoogleSignIn(false, true)}
              className="w-full min-h-[40px] bg-gray-900/10 dark:bg-white/10 hover:bg-gray-900/20 dark:hover:bg-white/20 text-xs py-2 px-4 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Try Redirect Sign-In Instead
            </button>
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full min-h-[40px] bg-gray-900/10 dark:bg-white/10 hover:bg-gray-900/20 dark:hover:bg-white/20 text-xs py-2 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in System Browser
            </button>
          </div>
        );
      } else if (msg.includes('missing initial state')) {
        setLocalError(
          <div className="text-left space-y-2">
            <p className="font-bold text-red-500">Browser Storage Restricted</p>
            <p className="text-xs">This browser is blocking sign-in storage. Open the app directly in Chrome or Safari to sign in smoothly:</p>
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white text-xs py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in System Browser
            </button>
          </div>
        );
      } else {
        setLocalError(code ? `${code}: ${msg || 'Failed to sign in.'}` : (msg || 'Failed to sign in. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
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
          {isVerifying ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-16 h-16 rounded-full bg-purple-500/20 blur-md animate-pulse" />
                <Loader2 className="relative w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Verifying your session...
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Syncing your Hunter profile and redirecting you now.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-500/5 rounded-2xl border border-gray-100 dark:border-purple-500/10">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Secure Login</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Your data is linked to your Google account.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-500/5 rounded-2xl border border-gray-100 dark:border-purple-500/10">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Persistent Progress</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Returning users get their quests and XP back instantly.</p>
                  </div>
                </div>
              </div>

              {localError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3.5 sm:p-4 rounded-xl text-red-700 dark:text-red-300 text-xs leading-relaxed">
                  {localError}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleGoogleSignIn(false)}
                disabled={isVerifying}
                className="w-full min-h-[48px] bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                Sign in with Google
              </button>

              <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                By signing in, you agree to the terms of service and privacy policy.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-center gap-8 opacity-50">
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Fast</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Reliable</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

