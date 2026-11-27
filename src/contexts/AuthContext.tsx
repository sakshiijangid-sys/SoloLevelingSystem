import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { auth } from '../firebase';

declare global {
  interface Window {
    median?: any;
  }
}

const AUTH_REDIRECT_PENDING_KEY = 'sls_auth_redirect_pending_ts';
const AUTH_REDIRECT_FAILED_KEY = 'sls_auth_redirect_failed';
const AUTH_RETURN_PATH_KEY = 'sls_auth_return_path';
const REDIRECT_TTL_MS = 2 * 60 * 1000; // 2 minutes

function writeStorage(key: string, value: string | null) {
  for (const store of [
    () => window.sessionStorage,
    () => window.localStorage,
  ]) {
    try {
      const s = store();
      if (value === null) {
        s.removeItem(key);
      } else {
        s.setItem(key, value);
      }
    } catch {
      // Ignore storage access errors in restricted browsers/WebViews
    }
  }
}

function readStorage(key: string): string | null {
  for (const store of [
    () => window.sessionStorage,
    () => window.localStorage,
  ]) {
    try {
      const val = store().getItem(key);
      if (val !== null) return val;
    } catch {
      // Ignore storage access errors
    }
  }
  return null;
}

export function saveAuthReturnPath(path: string) {
  if (path && path !== '/login') {
    writeStorage(AUTH_RETURN_PATH_KEY, path);
  }
}

export function peekAuthReturnPath(): string | null {
  const path = readStorage(AUTH_RETURN_PATH_KEY);
  return path && path !== '/login' ? path : null;
}

export function consumeAuthReturnPath(): string | null {
  const path = peekAuthReturnPath();
  writeStorage(AUTH_RETURN_PATH_KEY, null);
  return path;
}

function setRedirectPending(pending: boolean) {
  writeStorage(AUTH_REDIRECT_PENDING_KEY, pending ? String(Date.now()) : null);
}

function isRedirectPending(): boolean {
  const raw = readStorage(AUTH_REDIRECT_PENDING_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > REDIRECT_TTL_MS) {
    writeStorage(AUTH_REDIRECT_PENDING_KEY, null);
    return false;
  }
  return true;
}

const REDIRECT_FAILED_TTL_MS = 5 * 60 * 1000; // 5 minutes

function setRedirectFailed(failed: boolean) {
  writeStorage(AUTH_REDIRECT_FAILED_KEY, failed ? String(Date.now()) : null);
}

function hasRedirectFailedRecently(): boolean {
  const raw = readStorage(AUTH_REDIRECT_FAILED_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > REDIRECT_FAILED_TTL_MS) {
    writeStorage(AUTH_REDIRECT_FAILED_KEY, null);
    return false;
  }
  return true;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  verifying: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: (
    returnPath?: string,
    options?: { popupOnly?: boolean; forceRedirect?: boolean }
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<boolean>(() => isRedirectPending());
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let redirectSettled = false;
    let initialAuthEmitted = false;
    let latestUser: User | null = auth.currentUser;

    const finishLoadingIfReady = () => {
      if (!isMounted) return;
      if (redirectSettled && initialAuthEmitted) {
        setLoading(false);
        setVerifying(false);
      }
    };

    const resolveRedirect = async () => {
      const hadPendingRedirect = isRedirectPending();

      // Surface OAuth query errors (e.g. ?error=access_denied when OAuth consent screen is in Testing mode)
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthErr = params.get('error');
        if (oauthErr) {
          setRedirectFailed(true);
          setAuthError(
            oauthErr === 'access_denied'
              ? 'auth/access-denied: Google blocked sign-in for this account. If OAuth Consent Screen is in Testing mode, publish it to Production or add this email as a Test user.'
              : `OAuth error: ${oauthErr}`
          );
          setRedirectPending(false);
          redirectSettled = true;
          finishLoadingIfReady();
          return;
        }
      } catch {
        // Ignore URL parsing issues
      }

      try {
        const result = await getRedirectResult(auth, browserPopupRedirectResolver);
        if (!isMounted) return;

        if (result?.user) {
          latestUser = result.user;
          setUser(result.user);
          setAuthError(null);
          setRedirectFailed(false);
        } else if (hadPendingRedirect && !auth.currentUser && !latestUser) {
          // Wait briefly for IndexedDB/onAuthStateChanged hydration before flagging failure
          await new Promise(resolve => setTimeout(resolve, 400));
          if (isMounted && !auth.currentUser && !latestUser) {
            setRedirectFailed(true);
            setAuthError(
              'REDIRECT_STATE_LOST: Your browser blocked cross-site redirect storage when returning from Google. Use direct pop-up sign-in below instead.'
            );
          }
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error('Redirect login error:', error);
        const code = error?.code || '';
        if (code && code !== 'auth/no-current-user') {
          if (code === 'auth/unauthorized-domain') {
            setAuthError(`auth/unauthorized-domain: ${window.location.hostname}`);
          } else {
            setRedirectFailed(true);
            setAuthError(code ? `${code}: ${error.message || 'Could not complete Google redirect sign-in.'}` : (error.message || 'Could not complete Google redirect sign-in.'));
          }
        }
      } finally {
        setRedirectPending(false);
        redirectSettled = true;
        finishLoadingIfReady();
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return;
      latestUser = firebaseUser;
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthError(null);
        setRedirectPending(false);
        setRedirectFailed(false);
      }
      initialAuthEmitted = true;
      finishLoadingIfReady();
    });

    resolveRedirect();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (
    returnPath?: string,
    options?: { popupOnly?: boolean; forceRedirect?: boolean }
  ) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setAuthError(null);
    setVerifying(true);

    if (returnPath) {
      saveAuthReturnPath(returnPath);
    }

    try {
      // 1. Check for Median native bridge
      if (window.median?.google?.login) {
        return await new Promise<void>((resolve, reject) => {
          window.median.google.login({
            callback: async (data: any) => {
              if (data.idToken) {
                try {
                  const credential = GoogleAuthProvider.credential(data.idToken);
                  const credResult = await signInWithCredential(auth, credential);
                  setUser(credResult.user);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              } else if (data.error) {
                reject(new Error(data.error));
              } else {
                reject(new Error('Median login failed: No idToken received'));
              }
            },
          });
        });
      }

      // Explicit redirect option if requested directly by user
      if (options?.forceRedirect) {
        setRedirectPending(true);
        await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
        return;
      }

      // 2. Popup-first across all devices (Mobile Chrome/Safari & Desktop).
      // Pass browserPopupRedirectResolver explicitly so Firebase resolves cleanly across browsers.
      try {
        const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        if (result?.user) {
          setUser(result.user);
          setRedirectPending(false);
          setRedirectFailed(false);
        }
        return;
      } catch (popupError: any) {
        const code = popupError?.code || '';
        const isSameOriginAuthDomain =
          typeof window !== 'undefined' &&
          auth.app.options.authDomain === window.location.hostname;

        // Only auto-fallback to redirect when authDomain matches the current host (same-origin),
        // because cross-origin redirect triggers third-party cookie/storage loss loops.
        const canTryAutoRedirectFallback =
          !options?.popupOnly &&
          isSameOriginAuthDomain &&
          !hasRedirectFailedRecently() &&
          (code === 'auth/popup-blocked' ||
            code === 'auth/operation-not-supported-in-this-environment');

        if (canTryAutoRedirectFallback) {
          console.warn('Popup blocked on same-origin host, trying redirect fallback:', code);
          setRedirectPending(true);
          await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
          return;
        }

        throw popupError;
      }
    } catch (error) {
      setRedirectPending(false);
      setVerifying(false);
      throw error;
    } finally {
      if (!isRedirectPending()) {
        setVerifying(false);
      }
    }
  };

  const logout = async () => {
    try {
      setRedirectPending(false);
      setRedirectFailed(false);
      consumeAuthReturnPath();
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, verifying, authError, clearAuthError, signInWithGoogle, logout }}>
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


