import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onIdTokenChanged,
  type IdTokenResult,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  getMultiFactorResolver,
  type MultiFactorResolver,
  signInWithCredential,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../firebase';

declare global {
  interface Window {
    median?: any;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  redirectResolver?: MultiFactorResolver;
  claims: IdTokenResult['claims'] | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectResolver, setRedirectResolver] = useState<MultiFactorResolver>();
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);

  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence).catch(console.error);
    void getRedirectResult(auth).catch(error => {
      if (error.code === 'auth/multi-factor-auth-required') {
        setRedirectResolver(getMultiFactorResolver(auth, error));
      } else {
        console.error('Redirect sign-in failed:', error);
      }
    });

    let version = 0;
    const unsubscribe = onIdTokenChanged(auth, async current => {
      const latest = ++version;
      setUser(current);
      setClaims(null);
      try {
        const token = await current?.getIdTokenResult();
        if (latest === version) setClaims(token?.claims ?? null);
      } catch {
        if (latest === version) setClaims(null);
      } finally {
        if (latest === version) setLoading(false);
      }
    });
    return () => {
      version++;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const idleLimit = 30 * 60_000;
    const key = `solo_leveling_last_activity_${user.uid}`;
    let lastActivity = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const readActivity = () => {
      try {
        const stored = Number(localStorage.getItem(key));
        if (stored > 0 && stored <= Date.now()) lastActivity = Math.max(stored, lastActivity);
      } catch {
        // In-memory timeout still applies.
      }
    };
    try {
      const stored = Number(localStorage.getItem(key));
      const lastSignIn = Date.parse(user.metadata.lastSignInTime ?? '');
      if (stored > 0 && stored <= lastActivity && stored >= lastSignIn) lastActivity = stored;
    } catch {
      // In-memory timeout still applies.
    }
    const check = () => {
      readActivity();
      clearTimeout(timer);
      const remaining = idleLimit - (Date.now() - lastActivity);
      if (remaining <= 0) {
        if (auth.currentUser?.uid === user.uid) void firebaseSignOut(auth).catch(console.error);
        return false;
      }
      timer = setTimeout(check, remaining);
      return true;
    };
    const activity = () => {
      if (!check()) return;
      if (Date.now() - lastActivity < 1000) return;
      lastActivity = Date.now();
      try {
        localStorage.setItem(key, String(lastActivity));
      } catch {
        // In-memory timeout still applies.
      }
      check();
    };
    const events = ['pointerdown', 'keydown', 'scroll'] as const;
    events.forEach(event => window.addEventListener(event, activity, { passive: true }));
    document.addEventListener('visibilitychange', check);
    window.addEventListener('storage', check);
    check();
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, activity));
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('storage', check);
    };
  }, [user?.uid]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      // 1. CHECK FOR MEDIAN NATIVE BRIDGE
      if (window.median?.google?.login) {
        console.log("Using Median Native Google Login...");
        return new Promise<void>((resolve, reject) => {
          window.median.google.login({
            callback: async (data: any) => {
              if (data.idToken) {
                try {
                  const credential = GoogleAuthProvider.credential(data.idToken);
                  await signInWithCredential(auth, credential);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              } else if (data.error) {
                reject(new Error(data.error));
              } else {
                reject(new Error("Median login failed: No idToken received"));
              }
            }
          });
        });
      }

      // 2. STANDARD WEB FLOW
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isWebView = /WebView|(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);

      if (isWebView) {
        // WebViews struggle with both popup and redirect state.
        // We try popup first because it doesn't lose state as often if allowed.
        try {
          await signInWithPopup(auth, provider);
        } catch (popupError: any) {
          if (popupError.code === 'auth/multi-factor-auth-required') throw popupError;
          console.warn("Popup failed in WebView, trying redirect...", popupError);
          // If popup blocked or failed, fall back to redirect ONLY as last resort
          await signInWithRedirect(auth, provider);
        }
      } else if (isMobile) {
        // Redirection is usually better in mobile browsers
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, claims, redirectResolver, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
