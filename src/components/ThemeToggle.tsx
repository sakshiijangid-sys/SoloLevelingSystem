import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative inline-flex items-center select-none" id="theme-toggle-wrapper">
      <label
        htmlFor="theme-toggle-input"
        className="relative inline-block cursor-pointer"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <input
          id="theme-toggle-input"
          type="checkbox"
          checked={isDark}
          onChange={toggleTheme}
          className="sr-only peer"
          aria-label="Toggle Dark / Light Theme"
        />

        {/* Outer Capsule / Scenery Track */}
        <div
          className={`relative w-[76px] h-[38px] rounded-full overflow-hidden border border-purple-500/30 transition-all duration-700 ease-in-out shadow-inner ${
            isDark
              ? 'bg-[#0f0728] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_12px_rgba(168,85,247,0.2)]'
              : 'bg-gradient-to-b from-[#60a5fa] via-[#93c5fd] to-[#fed7aa] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Day / Sun / Clouds Scenery */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isDark ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Twin Suns / Planetary Moons */}
            <div className="absolute top-1.5 right-4 w-4 h-4 rounded-full bg-[#fde047] shadow-[0_0_8px_rgba(253,224,71,0.8)] border border-yellow-200" />
            <div className="absolute top-3.5 right-8 w-2.5 h-2.5 rounded-full bg-[#fb923c] opacity-80 shadow-[0_0_4px_rgba(251,146,60,0.6)]" />

            {/* Stylized Clouds & Sand Dunes */}
            <div className="absolute -bottom-2 right-1 w-9 h-5 bg-white/70 rounded-full blur-[0.3px]" />
            <div className="absolute -bottom-2.5 right-5 w-8 h-5 bg-amber-100/60 rounded-full" />
            <div className="absolute -bottom-3 left-6 w-12 h-6 bg-amber-200/40 rounded-full" />
          </div>

          {/* Night Stars Scenery */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Twinkling Stars */}
            <div className="absolute top-2 left-3 w-1 h-1 bg-purple-200 rounded-full shadow-[0_0_4px_#c084fc] animate-pulse" />
            <div className="absolute top-5 left-7 w-1 h-1 bg-white rounded-full opacity-80" />
            <div className="absolute bottom-2 left-4 w-0.5 h-0.5 bg-purple-300 rounded-full" />
            <div className="absolute top-2 left-10 w-0.5 h-0.5 bg-white rounded-full opacity-60" />

            {/* Glowing Cross Star */}
            <div className="absolute top-3 left-5 w-2 h-2 opacity-85">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-purple-300 shadow-[0_0_3px_#d8b4fe]" />
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-purple-300 shadow-[0_0_3px_#d8b4fe]" />
            </div>

            {/* Distant Nebula Dust */}
            <div className="absolute top-1 left-2 w-7 h-4 bg-purple-600/20 rounded-full blur-[2px]" />
          </div>

          {/* Ground Horizon Line */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-1.5 transition-colors duration-700 ${
              isDark ? 'bg-purple-950/80 border-t border-purple-800/40' : 'bg-amber-300/60 border-t border-amber-400/40'
            }`}
          />
        </div>

        {/* Animated Purple Robot (BB-8 / Droid Style) */}
        <div
          className={`absolute top-[3px] left-[3px] w-[32px] h-[32px] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none ${
            isDark ? 'translate-x-[38px]' : 'translate-x-0'
          }`}
        >
          {/* Head Component */}
          <div
            className={`relative mx-auto w-[22px] h-[13px] rounded-t-full bg-gradient-to-b from-purple-100 to-purple-200 dark:from-zinc-100 dark:to-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.25)] border-t border-l border-r border-purple-400/40 transition-transform duration-500 origin-bottom ${
              isDark ? 'rotate-[6deg]' : '-rotate-[4deg]'
            }`}
          >
            {/* Robot Antennae */}
            <div className="absolute -top-[4px] right-[4px] w-[1px] h-[4px] bg-purple-700 dark:bg-purple-400 shadow-[0_0_2px_rgba(168,85,247,0.8)]">
              <div className="absolute -top-[1.5px] -left-[0.5px] w-[2px] h-[2px] rounded-full bg-purple-400" />
            </div>
            <div className="absolute -top-[2.5px] right-[7px] w-[1px] h-[2.5px] bg-zinc-600 dark:bg-zinc-400" />

            {/* Head Purple Accent Stripes */}
            <div className="absolute top-[2.5px] left-0 right-0 h-[1.5px] bg-purple-600/80" />
            <div className="absolute bottom-[1px] left-[2px] right-[2px] h-[1px] bg-purple-500/50" />

            {/* Optical Primary Lens / Eye */}
            <div className="absolute top-[3.5px] left-[7px] w-[5px] h-[5px] rounded-full bg-zinc-950 border border-purple-500 shadow-[inset_0_0_2px_rgba(0,0,0,1)] flex items-center justify-center">
              {/* Inner Glowing Pupil */}
              <div
                className={`w-[2.5px] h-[2.5px] rounded-full transition-colors duration-500 ${
                  isDark ? 'bg-purple-400 shadow-[0_0_4px_#c084fc]' : 'bg-sky-400 shadow-[0_0_3px_#38bdf8]'
                }`}
              />
              {/* Glint Reflection */}
              <div className="absolute top-[0.5px] left-[0.5px] w-[1px] h-[1px] rounded-full bg-white opacity-80" />
            </div>

            {/* Secondary Sensor */}
            <div className="absolute top-[5px] right-[4px] w-[2px] h-[2px] rounded-full bg-zinc-900 border border-zinc-500" />
          </div>

          {/* Neck Joint Line */}
          <div className="w-[18px] h-[1px] mx-auto bg-zinc-400 dark:bg-zinc-500 -mt-[0.5px]" />

          {/* Spherical Body (Rolls with toggle translation) */}
          <div
            className={`relative mx-auto w-[22px] h-[22px] rounded-full bg-gradient-to-br from-purple-50 via-white to-purple-200 dark:from-zinc-200 dark:via-zinc-100 dark:to-purple-200 border border-purple-400/50 shadow-md overflow-hidden transition-transform duration-700 ${
              isDark ? 'rotate-[360deg]' : '-rotate-[360deg]'
            }`}
          >
            {/* Center Purple Cybernetic Ring */}
            <div className="absolute inset-[3.5px] rounded-full border-[2px] border-purple-600/90 flex items-center justify-center shadow-[0_0_4px_rgba(147,51,234,0.3)]">
              {/* Inner Metallic Core */}
              <div className="w-[4px] h-[4px] rounded-full bg-gradient-to-tr from-purple-800 to-purple-500 border border-purple-300" />
            </div>

            {/* Side Circuit Details */}
            <div className="absolute top-[1px] left-[1px] w-[4px] h-[4px] rounded-full border border-purple-500/70" />
            <div className="absolute bottom-[1px] right-[1px] w-[4px] h-[4px] rounded-full border border-purple-500/70" />
            <div className="absolute top-[8px] -left-[1px] w-[3px] h-[1.5px] bg-purple-600" />
            <div className="absolute top-[8px] -right-[1px] w-[3px] h-[1.5px] bg-purple-600" />

            {/* Shading / 3D Spherical Highlight */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/25 via-transparent to-white/40 pointer-events-none" />
          </div>

          {/* Ground Contact Shadow */}
          <div
            className={`w-[18px] h-[3px] mx-auto rounded-full bg-black/40 blur-[1px] transition-transform duration-700 ${
              isDark ? 'scale-x-90' : 'scale-x-100'
            }`}
          />
        </div>
      </label>
    </div>
  );
}
