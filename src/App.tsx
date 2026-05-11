import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import AIChatbot from './components/AIChatbot';
import AlarmMonitor from './components/AlarmMonitor';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Report from './pages/Report';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-purple-500/30 selection:text-purple-200">
        <Navbar />
        <AIChatbot />
        <AlarmMonitor />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/project/:id" 
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-project" 
            element={
              <ProtectedRoute>
                <NewProject />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/project/:id/report/:month" 
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } 
          />
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
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
