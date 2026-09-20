import React from 'react';
import footerBgImage from '../assets/images/footer_minimal_bg_1789831736917.jpg';
import { useTheme } from '../contexts/ThemeContext';
import { InteractiveDeviceMockup } from './InteractiveDeviceMockup';
import { Smartphone, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface FooterProps {
  onInstallClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onInstallClick }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer 
      id="footer-home" 
      className="relative w-full mt-8 sm:mt-12 md:mt-16 rounded-t-2xl xs:rounded-t-3xl sm:rounded-t-[2.5rem] rounded-b-none border-t border-b-0 border-purple-500/30 shadow-2xl bg-gradient-to-b from-gray-50/90 via-gray-100/90 to-gray-200/90 dark:from-zinc-950/90 dark:via-black/95 dark:to-black text-gray-800 dark:text-gray-200 backdrop-blur-md transition-all overflow-visible z-20"
    >
      {/* Minimal Atmospheric Background Image with Ambient Overlays */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-t-2xl xs:rounded-t-3xl sm:rounded-t-[2.5rem]">
        <img
          id="footer-bg-image"
          src={footerBgImage}
          alt=""
          role="presentation"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[15%_18%] sm:object-[20%_25%] md:object-[22%_30%] opacity-25 dark:opacity-45 mix-blend-multiply dark:mix-blend-screen transform scale-110 sm:scale-115 md:scale-120 -translate-x-6 sm:-translate-x-12 md:-translate-x-20 translate-y-4 sm:translate-y-8 md:translate-y-12 transition-all duration-300"
        />
        {/* Gradients to blend seamlessly into top and sides */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100/95 via-gray-50/85 to-transparent dark:from-black dark:via-black/80 dark:to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        {/* Subtle radial glow */}
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Content Container - Targeted Footer Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 py-5 sm:py-6 min-h-[380px] sm:h-[490px] flex flex-col justify-between overflow-visible">
        {/* Main Flexible Asymmetric Bar: Left Prompt (at top) + Right Mockup */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8 lg:gap-12 overflow-visible w-full flex-1 pt-1 sm:pt-2 pb-4">
          
          {/* Asymmetric Add to Home Screen Callout - Positioned at Top & Fluid Left Occupancy */}
          <motion.div 
            id="footer-homescreen-prompt"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="self-start w-full md:flex-1 max-w-full md:max-w-xl lg:max-w-2xl xl:max-w-3xl text-left select-none pointer-events-auto group z-20"
          >
            <div className="flex flex-col items-start gap-1.5 sm:gap-2 md:gap-2.5 p-0 bg-transparent transition-all duration-300 w-full">
              
              {/* Line 1: Add / Install Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading text-[10px] xs:text-[11px] sm:text-xs md:text-sm tracking-wider uppercase text-purple-700 dark:text-purple-300 font-semibold">
                  Get The Official App
                </span>
              </div>

              {/* Line 2: Solo Leveling System */}
              <h2 className="font-heading text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide uppercase text-zinc-950 dark:text-white drop-shadow-[0_0_14px_rgba(251,191,36,0.65)] leading-tight py-0.5">
                Solo Leveling System
              </h2>

              {/* Line 3: Dynamic wording adjusted for mobile/desktop layout */}
              <p className="font-sans text-xs sm:text-sm md:text-base lg:text-lg tracking-wide uppercase font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-xl lg:max-w-2xl">
                <span className="md:hidden">Install directly to your phone for rapid system access & full-screen hunter quests.</span>
                <span className="hidden md:inline">Download native APK or add shortcut to your home screen for full-screen hunter quests without browser headers.</span>
              </p>

              {/* Line 4: Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-2 sm:pt-3 w-full">
                <a
                  id="footer-apk-download-btn"
                  href="https://cf.admin.appmysite.com/832507/862516/android/builds/1.0.0/ams_android_862516_live.apk?_gl=1*634ui6*_gcl_au*MjUyMTUxNDMyLjE3ODk4MjM0ODA.*_ga*MTIzNzcwMzQ0NC4xNzg5ODIzNDgw*_ga_BWZ5717E0Z*czE3ODk4MjM0ODAkbzEkZzEkdDE3ODk4Mjk2MDIkajI1JGwwJGgw"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="SoloLevelingSystem.apk"
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg border border-purple-500/60 hover:border-purple-400 bg-purple-600/25 hover:bg-purple-600/40 text-purple-900 dark:text-purple-100 hover:text-white font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-[0_0_16px_rgba(168,85,247,0.3)] hover:shadow-[0_0_24px_rgba(168,85,247,0.55)] transition-all active:scale-95 cursor-pointer no-underline"
                  title="Download and install Android APK app"
                >
                  <Download className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>DOWNLOAD APK</span>
                </a>

                {/* Break to next line on mobile while keeping button compact */}
                <div className="w-full h-0 xs:hidden" />

                {onInstallClick && (
                  <button
                    type="button"
                    onClick={onInstallClick}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-400/40 dark:border-zinc-700/60 hover:border-purple-400/50 bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-purple-600/10 text-zinc-800 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-200 font-mono text-xs sm:text-sm font-medium uppercase tracking-wider transition-all active:scale-95 cursor-pointer w-auto"
                    title="Install as Progressive Web App"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                    <span>PWA GUIDE</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Footer Right Top Corner: Interactive Device Mockup Emerging Upward */}
          <div className="self-end md:self-start shrink-0 -mt-10 xs:-mt-14 sm:-mt-16 md:-mt-20 lg:-mt-24 translate-y-0 sm:translate-y-2 md:translate-y-3 relative z-30 filter drop-shadow-[0_-10px_24px_rgba(168,85,247,0.35)]">
            <InteractiveDeviceMockup isDark={isDark} />
          </div>
        </div>

        {/* Asymmetric Micro-Meta Strip */}
        <div className="mt-auto pt-3 border-t border-gray-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>SOLO LEVELING SYSTEM &copy; {new Date().getFullYear()}</span>
            <span className="inline">• MADE BY SAKSHI</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

