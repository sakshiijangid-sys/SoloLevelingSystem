import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, LogIn, User } from 'lucide-react';
import ProfileModal from './ProfileModal';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-purple-500/30 px-3 sm:px-6 py-2 sm:py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-[7px] xs:text-[9px] sm:text-xs md:text-sm font-normal font-heading bg-gradient-to-r from-gray-900 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
              SOLO LEVELING SYSTEM
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 sm:gap-4 ml-1">
                  <ThemeToggle />

                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="relative group focus:outline-none"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-300" />
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-purple-500/50 object-cover" 
                      />
                    ) : (
                      <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-purple-500/50 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                <Link 
                  to="/login"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center gap-1 sm:gap-2"
                >
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}

