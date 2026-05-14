import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force local persistence to help mobile WebViews
    setPersistence(auth, browserLocalPersistence);

    // Handle the result of a redirect login (important for mobile)
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
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
