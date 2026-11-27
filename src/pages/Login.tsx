import { useState, useEffect, ReactNode, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, peekAuthReturnPath, consumeAuthReturnPath } from '../contexts/AuthContext';
import {
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

type AuthMode = 'signin' | 'signup' | 'reset';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.46 1.15-4.22 1.15-3.24 0-5.99-2.19-6.97-5.14H1.02v3.14C3.03 21.13 7.19 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.03 14c-.25-.72-.39-1.49-.39-2.29s.14-1.57.39-2.29V6.28H1.02A11.98 11.98 0 0 0 0 11.71c0 1.93.46 3.76 1.02 5.43L5.03 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.58c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.09 15.3 0 12 0 7.19 0 3.03 2.87 1.02 7.14l4.01 3.14c.98-2.95 3.73-5.7 6.97-5.7Z"
      />
    </svg>
  );
}

export default function Login() {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    user,
    loading: authLoading,
    verifying,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<ReactNode | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const savedReturnPath = peekAuthReturnPath();
  const rawFrom = location.state?.from?.pathname || savedReturnPath || '/';
  const from = rawFrom === '/login' ? '/' : rawFrom;

  // Redirect cleanly as soon as auth resolves and a user session is active
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
        <div className="text-left space-y-1.5">
          <p className="font-bold">Domain Unauthorized</p>
          <p className="text-xs leading-relaxed">
            Add this hostname under Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains:
          </p>
          <code className="block bg-black/10 dark:bg-black/40 px-2.5 py-1.5 rounded font-mono text-[11px] break-all">
            {window.location.hostname}
          </code>
        </div>
      );
    } else if (
      authError.includes('auth/access-denied') ||
      authError.includes('auth/admin-restricted-operation') ||
      authError.includes('auth/operation-not-allowed')
    ) {
      setLocalError(
        <div className="text-left space-y-1.5">
          <p className="font-bold">Google OAuth Restricted for This Email</p>
          <p className="text-xs leading-relaxed">
            Sign in or create an account with <b>Email &amp; Password</b> right here, or switch your Google Cloud OAuth Consent Screen from <b>Testing</b> to <b>In production</b>.
          </p>
        </div>
      );
    } else if (authError.includes('REDIRECT_STATE_LOST') || authError.includes('missing initial state')) {
      setLocalError(
        <div className="text-left space-y-1.5">
          <p className="font-bold">Browser Blocked Google Redirect Session</p>
          <p className="text-xs leading-relaxed">
            Your browser cleared cross-site redirect storage on return. Sign in using <b>Email &amp; Password</b> above, or allow pop-ups and tap <b>Continue with Google</b>.
          </p>
        </div>
      );
    } else {
      setLocalError(authError);
    }
  }, [authError]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalError(null);
    setStatusMessage(null);
    clearAuthError();
  };

  const isVerifying = authLoading || verifying || Boolean(user);

  const mapFirebaseAuthError = (err: any): ReactNode => {
    const code = err?.code || '';
    const msg = err?.message || '';

    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support if you believe this is an error.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Double-check your credentials or create a new account.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Switch to Sign In or use Continue with Google.';
      case 'auth/weak-password':
        return 'Password is too weak. Choose at least 6 characters with a mix of letters and numbers.';
      case 'auth/too-many-requests':
        return 'Too many attempts from this device. Wait a short moment before trying again.';
      case 'auth/network-request-failed':
        return 'Network error while reaching Firebase Authentication. Check your internet connection and retry.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email under another sign-in method. Sign in with that method first.';
      case 'auth/operation-not-allowed':
        return (
          <div className="text-left space-y-1.5">
            <p className="font-bold">Sign-In Method Not Enabled Yet</p>
            <p className="text-xs leading-relaxed">
              Enable <b>Email/Password</b> under Firebase Console &gt; Authentication &gt; Sign-in method, and ensure <b>Enable create (sign-up)</b> is turned on.
            </p>
          </div>
        );
      case 'auth/unauthorized-domain':
        return (
          <div className="text-left space-y-1.5">
            <p className="font-bold">Domain Unauthorized</p>
            <p className="text-xs leading-relaxed">
              Add this hostname to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains:
            </p>
            <code className="block bg-black/10 dark:bg-black/40 px-2.5 py-1.5 rounded font-mono text-[11px] break-all">
              {window.location.hostname}
            </code>
          </div>
        );
      default:
        if (msg.includes('access_denied')) {
          return 'Google blocked access for this email while OAuth Consent Screen is in Testing mode. Use Email & Password or publish OAuth to Production.';
        }
        return code ? `${code}: ${msg || 'Authentication failed.'}` : (msg || 'Authentication failed. Please try again.');
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setStatusMessage(null);
    clearAuthError();

    if (Date.now() < cooldownUntil) {
      const waitSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setLocalError(`Please wait ${waitSeconds}s before trying again.`);
      return;
    }

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(trimmedEmail);
        setStatusMessage(`Password reset instructions were sent to ${trimmedEmail}. Check your inbox and spam folder.`);
      } catch (err: any) {
        setLocalError(mapFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(trimmedEmail, password, displayName, from);
      } else {
        await signInWithEmail(trimmedEmail, password, from);
      }
      setFailedAttempts(0);
      setCooldownUntil(0);
    } catch (err: any) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 3) {
        const delayMs = Math.min(30_000, 1000 * 2 ** (nextFailures - 3));
        setCooldownUntil(Date.now() + delayMs);
      }
      setLocalError(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async (popupOnly = false, forceRedirect = false) => {
    setIsSubmitting(true);
    setLocalError(null);
    setStatusMessage(null);
    clearAuthError();

    try {
      await signInWithGoogle(from, { popupOnly, forceRedirect });
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLocalError(
          <div className="text-left space-y-1.5">
            <p className="font-bold">Google Sign-In Closed Before Completing</p>
            <p className="text-xs leading-relaxed">
              If Google showed <b>"Access blocked"</b> for this email, switch your Google Cloud OAuth consent screen to <b>In production</b>, or sign in with <b>Email &amp; Password</b> above.
            </p>
          </div>
        );
      } else if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        msg.includes('POPUP_AND_REDIRECT_BLOCKED')
      ) {
        setLocalError(
          <div className="text-left space-y-2.5">
            <p className="font-bold">Pop-up Blocked by Browser</p>
            <p className="text-xs leading-relaxed">
              Allow pop-ups for <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">{window.location.hostname}</code> or use Email &amp; Password above:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn(true, false)}
                className="flex-1 min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white text-xs py-2.5 px-4 rounded-xl font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Retry Pop-up
              </button>
              <button
                type="button"
                onClick={() => handleGoogleSignIn(false, true)}
                className="flex-1 min-h-[44px] bg-gray-900/10 dark:bg-white/10 hover:bg-gray-900/20 dark:hover:bg-white/20 text-xs py-2.5 px-4 rounded-xl font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Try Redirect
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full min-h-[40px] bg-gray-900/5 dark:bg-white/5 hover:bg-gray-900/10 dark:hover:bg-white/10 text-xs py-2 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in System Browser
            </button>
          </div>
        );
      } else {
        setLocalError(mapFirebaseAuthError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-10 relative overflow-hidden transition-colors duration-300 flex items-center">
      {/* Subtle Ambient Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(147,51,234,0.12),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.08),transparent_55%)] pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Asymmetric Editorial Anchor */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-5 text-left space-y-6"
        >
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-purple-600 dark:text-purple-400">
              Account Access
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading leading-snug text-gray-900 dark:text-white [text-wrap:balance]">
              Solo Leveling System
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
              Sign in with your email or Google account to sync quests, daily streaks, and monthly progress across every device.
            </p>
          </div>

          <div className="pt-2 space-y-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="pt-4">
              <p className="text-xs font-mono uppercase tracking-wider text-gray-900 dark:text-gray-100">
                01. Universal Access
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create an account with any email address or continue with Google on desktop and mobile.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
              <p className="text-xs font-mono uppercase tracking-wider text-gray-900 dark:text-gray-100">
                02. Persistent Progress
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your quests, daily XP bonuses, and analytics remain private and synced to your account.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
              <p className="text-xs font-mono uppercase tracking-wider text-gray-900 dark:text-gray-100">
                03. Instant Recovery
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Reset your password anytime directly from the sign-in panel.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Asymmetric Auth Panel (Single Elevation) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-7"
        >
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
            {isVerifying ? (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-9 h-9 text-purple-600 dark:text-purple-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Verifying your session...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Syncing your account and opening your workspace.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {mode === 'reset' ? (
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-200 dark:border-zinc-800">
                    <div>
                      <h2 className="text-base sm:text-lg font-heading text-gray-900 dark:text-white">
                        Reset Password
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Enter your account email to receive a reset link.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap shrink-0 min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </div>
                ) : (
                  <div
                    role="tablist"
                    aria-label="Authentication mode"
                    className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'signin'}
                      onClick={() => switchMode('signin')}
                      className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        mode === 'signin'
                          ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'signup'}
                      onClick={() => switchMode('signup')}
                      className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        mode === 'signup'
                          ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {localError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 p-3.5 rounded-xl text-red-700 dark:text-red-300 text-xs sm:text-sm leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1 min-w-0">{localError}</div>
                  </div>
                )}

                {statusMessage && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <div className="flex-1 min-w-0">{statusMessage}</div>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="login-display-name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Display Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="login-display-name"
                          name="displayName"
                          type="text"
                          autoComplete="name"
                          maxLength={60}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          disabled={isSubmitting}
                          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isSubmitting}
                        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {mode !== 'reset' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="login-password"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Password
                        </label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => switchMode('reset')}
                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="login-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                          required
                          minLength={mode === 'signup' ? 6 : undefined}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                          disabled={isSubmitting}
                          className="w-full min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[46px] bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {mode === 'signin'
                        ? 'Sign In'
                        : mode === 'signup'
                          ? 'Create Account'
                          : 'Send Reset Link'}
                    </span>
                  </button>
                </form>

                {mode !== 'reset' && (
                  <>
                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-gray-200 dark:border-zinc-800" />
                      <span className="px-3 text-xs font-mono uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        or
                      </span>
                      <div className="flex-grow border-t border-gray-200 dark:border-zinc-800" />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGoogleSignIn(false, false)}
                      disabled={isSubmitting}
                      className="w-full min-h-[46px] bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 px-6 py-3 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      <GoogleLogo />
                      <span>Continue with Google</span>
                    </button>
                  </>
                )}

                <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                  Your account data is private and secured through Firebase Authentication.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
