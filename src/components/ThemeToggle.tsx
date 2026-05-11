import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-20 h-10 rounded-full cursor-pointer focus:outline-none transition-all duration-500 overflow-hidden group shadow-lg border-2 border-white/10"
      aria-label="Toggle Theme"
    >
      {/* Background Gradients */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          background: isDark 
            ? 'linear-gradient(to bottom, #1C0954 0%, #15084E 100%)' 
            : 'linear-gradient(to bottom, #8BA9BF 0%, #F9D0A3 100%)'
        }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Light Mode Clouds */}
        <motion.div
          initial={false}
          animate={{ opacity: isDark ? 0 : 1, y: isDark ? 10 : 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="absolute inset-0"
        >
          {/* Clouds from the image */}
          <div className="absolute top-2 right-4 w-6 h-4 bg-white/80 rounded-full blur-[0.5px]" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
          <div className="absolute top-4 right-1 w-5 h-3 bg-white/60 rounded-full blur-[1px]" />
          <div className="absolute bottom-2 right-8 w-4 h-2 bg-white/50 rounded-full blur-[1px]" />
          <div className="absolute bottom-3 right-2 w-6 h-3 bg-white/70 rounded-full blur-[0.5px]" />
        </motion.div>

        {/* Dark Mode Stars */}
        <motion.div
          initial={false}
          animate={{ opacity: isDark ? 1 : 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="absolute inset-0"
        >
          {/* Specific star pattern from image */}
          <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full shadow-[0_0_2px_white]" />
          <div className="absolute top-6 left-2 w-1 h-1 bg-white rounded-full opacity-60" />
          <div className="absolute bottom-3 left-6 w-1 h-1 bg-white rounded-full" />
          
          {/* Cross stars */}
          <div className="absolute top-3 left-10 w-2 h-2">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white opacity-40 shadow-[0_0_4px_white]" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white opacity-40 shadow-[0_0_4px_white]" />
          </div>
          
          <div className="absolute bottom-4 left-2 w-1.5 h-1.5">
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white opacity-60" />
             <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white opacity-60" />
          </div>
        </motion.div>
      </div>

      {/* Switch Handle (Sun / Moon) */}
      <motion.div
        className="relative z-10 w-8 h-8 rounded-full m-1 flex items-center justify-center overflow-hidden"
        initial={false}
        animate={{
          x: isDark ? 40 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {/* Sun Gradient */}
        <motion.div
          animate={{ opacity: isDark ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-gradient-to-b from-[#FFBA33] to-[#FF9033] shadow-[0_0_10px_rgba(255,186,51,0.5)]"
        />
        
        {/* Moon Aesthetic */}
        <motion.div
          animate={{ opacity: isDark ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-[#F5DEB3]"
        >
          {/* Moon Craters */}
          <div className="absolute top-1 left-2 w-2 h-2 bg-[#DDBB8E] rounded-full opacity-60" />
          <div className="absolute top-4 left-4 w-3 h-3 bg-[#DDBB8E] rounded-full opacity-40" />
          <div className="absolute bottom-1 left-3 w-1.5 h-1.5 bg-[#DDBB8E] rounded-full opacity-50" />
          <div className="absolute top-2 right-1 w-2.5 h-2.5 bg-[#DDBB8E] rounded-full opacity-40" />
        </motion.div>
      </motion.div>
    </button>
  );
}
