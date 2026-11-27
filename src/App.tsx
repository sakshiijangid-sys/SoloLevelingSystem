import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { DailyBonusProvider } from './contexts/DailyBonusContext';
import Navbar from './components/Navbar';
import AIChatbot from './components/AIChatbot';
import AlarmMonitor from './components/AlarmMonitor';
import DailyBonusModal from './components/DailyBonusModal';
import Home from './pages/Home';



import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { lazy, Suspense, type ReactNode } from 'react';

const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const NewProject = lazy(() => import('./pages/NewProject'));
const Report = lazy(() => import('./pages/Report'));
const TodayTasks = lazy(() => import('./pages/TodayTasks'));
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'));

function QuestScreen({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <ProtectedRoute>
      <ErrorBoundary key={pathname} feature="Quest">
        <Suspense fallback={<p role="status" className="pt-24 text-center">Loading…</p>}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, verifying } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  if (loading || verifying) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} flex flex-col items-center justify-center gap-3`}>
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium opacity-70">Verifying your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}


function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-purple-500/30 selection:text-purple-200">
        <Navbar />
        <ErrorBoundary feature="Chat"><AIChatbot /></ErrorBoundary>
        <ErrorBoundary feature="Alarm"><AlarmMonitor /></ErrorBoundary>
        {user && user.uid && <DailyBonusModal />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<ErrorBoundary feature="Sign-in"><Login /></ErrorBoundary>} />
          <Route 
            path="/project/:id" 
            element={
              <QuestScreen><ProjectDetail /></QuestScreen>
            } 
          />
          <Route 
            path="/new-project" 
            element={
              <QuestScreen><NewProject /></QuestScreen>
            } 
          />
          <Route 
            path="/project/:id/report/:month" 
            element={
              <QuestScreen><Report /></QuestScreen>
            } 
          />
          <Route path="/today" element={<QuestScreen><TodayTasks /></QuestScreen>} />
          <Route path="/account" element={
            <ProtectedRoute>
              <ErrorBoundary feature="Account security">
                <Suspense fallback={<p role="status" className="pt-24 text-center">Loading…</p>}>
                  <AccountSecurity />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DailyBonusProvider>
            <AppContent />
          </DailyBonusProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

