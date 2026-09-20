import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Wifi, Battery, Zap, Sparkles, Sun, Moon } from 'lucide-react';

interface InteractiveDeviceMockupProps {
  isDark?: boolean;
}

export const InteractiveDeviceMockup: React.FC<InteractiveDeviceMockupProps> = ({ isDark: globalIsDark = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(3);
  const [rotateY, setRotateY] = useState<number>(-6);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 45,
    y: 40,
    opacity: 0.15,
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [deviceTheme, setDeviceTheme] = useState<'light' | 'dark'>(globalIsDark ? 'dark' : 'light');

  useEffect(() => {
    setDeviceTheme(globalIsDark ? 'dark' : 'light');
  }, [globalIsDark]);

  const isScreenDark = deviceTheme === 'dark';

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rY = ((x - centerX) / centerX) * 12;
    const rX = -((y - centerY) / centerY) * 12;

    setRotateX(rX);
    setRotateY(rY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.32 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(3);
    setRotateY(-6);
    setGlarePosition({ x: 45, y: 40, opacity: 0.15 });
  };

  return (
    <div className="relative flex flex-col items-end select-none">
      {/* 3D Perspective Card Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1000 }}
        className="relative cursor-pointer transition-transform duration-200"
      >
        {/* Ambient Backlight Glow underneath the Device */}
        <div
          className={`absolute -inset-3 rounded-[3rem] blur-xl transition-all duration-700 pointer-events-none ${
            isScreenDark
              ? 'bg-gradient-to-tr from-purple-600/35 via-indigo-600/25 to-amber-500/20'
              : 'bg-gradient-to-tr from-amber-400/30 via-purple-400/25 to-blue-400/20'
          } ${isHovered ? 'opacity-100 scale-105' : 'opacity-60 scale-95'}`}
        />

        {/* Emergence Levitation Floating Motion Wrapper */}
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {/* Emergence Rift Light Base Emitter - projecting light as it rises outside */}
          <div className="absolute -bottom-8 inset-x-2 h-12 bg-purple-600/35 dark:bg-purple-500/45 blur-xl rounded-full pointer-events-none transform scale-x-125 animate-pulse" />
          <div className="absolute -bottom-3 inset-x-6 h-3 bg-gradient-to-r from-transparent via-purple-400 to-transparent blur-[2px] pointer-events-none opacity-90" />

          {/* 3D Tilting Phone Body */}
          <motion.div
            animate={{
              rotateX: rotateX,
              rotateY: rotateY,
              scale: isHovered ? 1.03 : 1,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-[195px] xs:w-[215px] sm:w-[235px] md:w-[248px] h-[385px] xs:h-[415px] sm:h-[445px] md:h-[470px] rounded-[2.8rem] bg-gradient-to-b from-zinc-700 via-zinc-900 to-black p-2 sm:p-2.5 border-2 border-zinc-500/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(168,85,247,0.35)] ring-1 ring-white/20"
          >
          {/* Hardware Side Buttons */}
          <div className="absolute -left-[4.5px] top-20 w-[3px] h-5 bg-zinc-700 rounded-l-sm shadow-sm" />
          <div className="absolute -left-[4.5px] top-28 w-[3px] h-8 bg-zinc-700 rounded-l-sm shadow-sm" />
          <div className="absolute -left-[4.5px] top-38 w-[3px] h-8 bg-zinc-700 rounded-l-sm shadow-sm" />

          {/* Inner Titanium Bezel with Inset Specular Border */}
          <div className="relative w-full h-full rounded-[2.1rem] overflow-hidden bg-zinc-950 flex flex-col border border-zinc-800/80 shadow-inner">
            
            {/* Dynamic Island Pill */}
            <div className="absolute top-2 inset-x-0 z-40 flex justify-center pointer-events-none">
              <div className="w-20 h-4.5 rounded-full bg-black/95 border border-zinc-800/80 flex items-center justify-between px-2 shadow-md">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-blue-950/80" />
                  </div>
                  <div className="w-1 h-1 rounded-full bg-amber-500/90 animate-pulse" />
                </div>
                <div className="text-[7px] font-mono text-purple-400 font-semibold tracking-tighter">
                  SOLO 48
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className={`relative z-30 flex items-center justify-between px-4 pt-1.5 text-[9px] font-mono font-medium pointer-events-none ${
              isScreenDark ? 'text-white/80' : 'text-zinc-900/80'
            }`}>
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <Wifi className="w-2 h-2" />
                <span className="text-[7px] font-bold">5G</span>
                <Battery className={`w-3 h-3 ${isScreenDark ? 'text-emerald-400 fill-emerald-400' : 'text-emerald-600 fill-emerald-600'}`} />
              </div>
            </div>

            {/* Screen Viewport: Exact Live Website Screenshot Replica */}
            <div className={`relative flex-1 w-full overflow-hidden flex flex-col transition-colors duration-500 ${
              isScreenDark ? 'bg-black text-white' : 'bg-purple-50 text-gray-900'
            }`}>
              {/* Mini App Top Header Bar */}
              <div className={`px-2.5 py-1 flex items-center justify-between border-b text-[8px] font-mono ${
                isScreenDark ? 'bg-black/60 border-zinc-800/80 text-zinc-300' : 'bg-white/80 border-purple-200/60 text-zinc-700'
              } backdrop-blur-sm z-20`}>
                <div className="flex items-center gap-1 font-heading uppercase text-purple-600 dark:text-purple-400 font-bold">
                  <Sparkles className="w-2 h-2" />
                  <span>Solo Leveling</span>
                </div>
                {/* Clickable mini theme toggle inside phone */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeviceTheme(t => t === 'dark' ? 'light' : 'dark');
                  }}
                  title="Toggle Mockup Preview Mode"
                  className="p-0.5 rounded hover:bg-purple-500/20 text-purple-500 transition-colors"
                >
                  {isScreenDark ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
                </button>
              </div>

              {/* Exact Website Hero Section Replica */}
              <div className="relative flex-1 flex flex-col items-center justify-center p-2.5 text-center overflow-hidden">
                {/* Background Artwork - EXACT image from website */}
                <img
                  src={
                    isScreenDark
                      ? "https://i.pinimg.com/736x/ce/c0/10/cec01034e7a2542dcc34ceff07beca56.jpg"
                      : "https://i.pinimg.com/736x/1f/b9/41/1fb941fb26a02c3ef65cf96747124aca.jpg"
                  }
                  alt="Website Background"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-85"
                />

                {/* Subtle gradient shield to ensure text pop */}
                <div className={`absolute inset-0 pointer-events-none ${
                  isScreenDark
                    ? 'bg-gradient-to-b from-black/50 via-transparent to-black/70'
                    : 'bg-gradient-to-b from-white/30 via-transparent to-purple-100/40'
                }`} />

                {/* Golden aura core */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full bg-amber-400/25 blur-2xl animate-pulse" />
                </div>

                {/* Main Hero Content (Identical to screenshot_1) */}
                <div className="relative z-10 flex flex-col items-center space-y-1.5 w-full">
                  {/* Pixel Title */}
                  <h2
                    className={`font-heading uppercase tracking-wide text-xs xs:text-sm font-normal leading-tight select-none ${
                      isScreenDark ? 'text-white' : 'text-[#120224]'
                    }`}
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.85)) drop-shadow(0 0 12px rgba(245,158,11,0.6))',
                    }}
                  >
                    Solo Leveling System
                  </h2>

                  {/* Subtitle */}
                  <p className={`font-sans uppercase text-[7px] xs:text-[8px] tracking-wider font-semibold ${
                    isScreenDark ? 'text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-zinc-950 font-bold'
                  }`}>
                    Level up your learning experience
                  </p>

                  {/* Purple CTA Button: ACCESS SYSTEM */}
                  <div className="pt-1.5">
                    <div
                      className="px-3.5 py-1.5 rounded-lg text-[8px] xs:text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md bg-purple-600 text-white border border-purple-400/30"
                      style={{
                        boxShadow: '0 0 12px rgba(168,85,247,0.5)',
                      }}
                    >
                      <Zap className="w-2.5 h-2.5 fill-current animate-pulse text-amber-300" />
                      <span>ACCESS SYSTEM</span>
                    </div>
                  </div>

                  {/* Authentication Required Pill Badge */}
                  <div className="pt-0.5">
                    <span className={`text-[6px] xs:text-[6.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isScreenDark
                        ? 'text-purple-300 border-purple-500/40 bg-purple-950/40'
                        : 'text-purple-700 border-purple-500/40 bg-purple-50/80'
                    }`}>
                      Authentication Required to Save Data
                    </span>
                  </div>
                </div>

                {/* Bottom HUD mini bar inside screen */}
                <div className={`absolute bottom-1.5 inset-x-2 z-20 flex items-center justify-between px-2 py-1 rounded-lg backdrop-blur-md border text-[7px] font-mono ${
                  isScreenDark
                    ? 'bg-black/80 border-purple-500/30 text-purple-300'
                    : 'bg-white/85 border-purple-300/50 text-purple-900'
                }`}>
                  <span>MANA: 100%</span>
                  <span className="font-bold text-amber-500">LVL 48 HUNTER</span>
                </div>
              </div>

              {/* Dynamic Specular Glass Glare Overlay tracking Mouse Position */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${glarePosition.opacity}) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 70%)`,
                }}
              />

              {/* Diagonal Light Glaze reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent pointer-events-none" />
            </div>

            {/* Bottom Mobile Home Indicator Bar */}
            <div className="relative z-30 py-1 bg-black/95 flex justify-center pointer-events-none">
              <div className="w-16 h-0.5 rounded-full bg-white/40" />
            </div>
          </div>
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
