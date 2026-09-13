import React from 'react';

interface RobotIconProps {
  className?: string;
  isHappy?: boolean;
  isAlert?: boolean;
}

export default function RobotIcon({ className, isHappy = true, isAlert = false }: RobotIconProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Pearly Glossy White Chassis Gradient (For Head, Body, Ears, and Arms) */}
        <linearGradient id="whiteChassisGrad" x1="20" y1="15" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#FAF8FF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>

        {/* Purple Neon Lights Gradient */}
        <linearGradient id="purpleNeonGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E879F9" />
          <stop offset="50%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        {/* High-Gloss Black Face Screen */}
        <linearGradient id="blackScreenGrad" x1="30" y1="28" x2="90" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#05020c" />
          <stop offset="60%" stopColor="#0a0618" />
          <stop offset="100%" stopColor="#150f2e" />
        </linearGradient>

        {/* Cyan Glowing Anime Eyes */}
        <linearGradient id="glowEye" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Soft Pink Blush */}
        <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </radialGradient>

        {/* Purple Neon Glow Filter */}
        <filter id="purpleNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Subtle Cyan / Eye Glow Filter */}
        <filter id="cyanEyeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Thruster Flame Glow */}
        <filter id="thrusterGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Floating Ground Shadow with pulsating rhythm */}
      <ellipse cx="60" cy="113" rx="26" ry="4.5" fill="#581C87" fillOpacity="0.3" className="animate-pulse" />

      {/* Hover Thruster Purple Neon Energy Flare */}
      <g filter="url(#thrusterGlow)">
        <path d="M48 98 Q60 115 72 98 Q60 106 48 98Z" fill="#C084FC" fillOpacity="0.9" />
        <path d="M52 98 Q60 110 68 98 Q60 103 52 98Z" fill="#F472B6" />
      </g>

      {/* Floating Arms (White paws with purple neon wrist bands & pink pads) */}
      <g className="transition-transform duration-300">
        {/* Left Arm */}
        <path
          d="M26 74 C20 78 18 86 24 92 C28 96 36 93 37 86 C38 80 32 72 26 74 Z"
          fill="url(#whiteChassisGrad)"
          stroke="#C084FC"
          strokeWidth="1.2"
        />
        {/* Left Purple Neon Wrist Band */}
        <ellipse cx="32" cy="80" rx="3.5" ry="1.5" fill="#C084FC" filter="url(#purpleNeonGlow)" />
        {/* Left Pink Paw Pad */}
        <circle cx="26.5" cy="86" r="3" fill="#F472B6" fillOpacity="0.8" />

        {/* Right Arm (Waving angle) */}
        <path
          d="M94 74 C100 78 102 86 96 92 C92 96 84 93 83 86 C82 80 88 72 94 74 Z"
          fill="url(#whiteChassisGrad)"
          stroke="#C084FC"
          strokeWidth="1.2"
        />
        {/* Right Purple Neon Wrist Band */}
        <ellipse cx="88" cy="80" rx="3.5" ry="1.5" fill="#C084FC" filter="url(#purpleNeonGlow)" />
        {/* Right Pink Paw Pad */}
        <circle cx="93.5" cy="86" r="3" fill="#F472B6" fillOpacity="0.8" />
      </g>

      {/* Pristine White Torso Capsule */}
      <g>
        <rect x="39" y="69" width="42" height="29" rx="14.5" fill="url(#whiteChassisGrad)" stroke="#C084FC" strokeWidth="1.2" />
        
        {/* Purple Neon Trim around Belly Screen */}
        <rect x="44.5" y="73" width="31" height="20" rx="9" fill="none" stroke="#C084FC" strokeWidth="1.8" filter="url(#purpleNeonGlow)" />
        
        {/* Dark Belly Screen */}
        <rect x="45.5" y="74" width="29" height="18" rx="8" fill="url(#blackScreenGrad)" />
        
        {/* Heart / Spark Energy Core */}
        <path
          d="M60 86 C58 83 52 83 52 79 C52 76.5 54.5 75 57 75 C58.5 75 60 76.5 60 76.5 C60 76.5 61.5 75 63 75 C65.5 75 68 76.5 68 79 C68 83 62 83 60 86 Z"
          fill="#F472B6"
          filter="url(#purpleNeonGlow)"
          className="animate-pulse"
        />
        
        {/* Belly status dots */}
        <circle cx="49" cy="89" r="1.5" fill="#38BDF8" />
        <circle cx="71" cy="89" r="1.5" fill="#FDE047" />
      </g>

      {/* Purple Neon Collar Light Ring between Head and Torso */}
      <ellipse cx="60" cy="69" rx="14" ry="2.5" fill="#C084FC" filter="url(#purpleNeonGlow)" />

      {/* White Headphone Ears with Glowing Purple Neon Rings */}
      <g>
        {/* Left Ear */}
        <rect x="11" y="35" width="13" height="27" rx="6.5" fill="url(#whiteChassisGrad)" stroke="#DDD6FE" strokeWidth="1.2" />
        {/* Glowing Purple Neon Outer Ring */}
        <circle cx="17.5" cy="48.5" r="5.5" fill="none" stroke="#C084FC" strokeWidth="1.8" filter="url(#purpleNeonGlow)" />
        <circle cx="17.5" cy="48.5" r="3.5" fill="#F472B6" />
        <circle cx="16.5" cy="47.5" r="1.2" fill="#FFFFFF" />

        {/* Right Ear */}
        <rect x="96" y="35" width="13" height="27" rx="6.5" fill="url(#whiteChassisGrad)" stroke="#DDD6FE" strokeWidth="1.2" />
        {/* Glowing Purple Neon Outer Ring */}
        <circle cx="102.5" cy="48.5" r="5.5" fill="none" stroke="#C084FC" strokeWidth="1.8" filter="url(#purpleNeonGlow)" />
        <circle cx="102.5" cy="48.5" r="3.5" fill="#F472B6" />
        <circle cx="101.5" cy="47.5" r="1.2" fill="#FFFFFF" />
      </g>

      {/* Head Antenna with Glowing Purple Neon / Pink Orb Tip */}
      <g>
        <path d="M60 16 L60 8" stroke="#C084FC" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="60" cy="6" r="4.5" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1.2" filter="url(#purpleNeonGlow)" />
        <circle cx="58.5" cy="4.5" r="1.2" fill="#FFFFFF" />
      </g>

      {/* Big Cute Pearly White Chibi Head */}
      <path
        d="M22 44 C22 23 38 14 60 14 C82 14 98 23 98 44 C98 62 84 72 60 72 C36 72 22 62 22 44 Z"
        fill="url(#whiteChassisGrad)"
        stroke="#DDD6FE"
        strokeWidth="1.5"
      />

      {/* Curved Glossy Highlight on White Head Dome */}
      <path
        d="M32 23 C40 17 55 15 68 17 C64 20 44 22 32 23 Z"
        fill="#FFFFFF"
        fillOpacity="0.85"
      />

      {/* Purple Neon Frame / Glowing Border around Black Screen */}
      <rect
        x="27.5"
        y="26.5"
        width="65"
        height="37"
        rx="17.5"
        fill="none"
        stroke="#C084FC"
        strokeWidth="2.5"
        filter="url(#purpleNeonGlow)"
      />

      {/* High-Gloss Deep Black Face Screen */}
      <rect x="29" y="28" width="62" height="34" rx="16" fill="url(#blackScreenGrad)" stroke="#A855F7" strokeWidth="1" />

      {/* Gloss reflection inside black screen */}
      <path
        d="M36 31 C46 30 65 30 84 32 C78 35 52 35 36 31 Z"
        fill="#FFFFFF"
        fillOpacity="0.18"
      />

      {/* Soft Rosy Cheeks */}
      <ellipse cx="36" cy="52" rx="5" ry="3" fill="url(#blushGrad)" />
      <ellipse cx="84" cy="52" rx="5" ry="3" fill="url(#blushGrad)" />

      {/* Cute Expressive Neon Cyan Eyes */}
      {isAlert ? (
        /* Alert Wide Starry Eyes */
        <g filter="url(#cyanEyeGlow)">
          <ellipse cx="44" cy="43" rx="7.5" ry="9" fill="url(#glowEye)" />
          <ellipse cx="76" cy="43" rx="7.5" ry="9" fill="url(#glowEye)" />
          {/* Big Sparkle Pupils */}
          <circle cx="42" cy="40" r="3" fill="#FFFFFF" />
          <circle cx="46" cy="46" r="1.5" fill="#FFFFFF" />
          <circle cx="74" cy="40" r="3" fill="#FFFFFF" />
          <circle cx="78" cy="46" r="1.5" fill="#FFFFFF" />
        </g>
      ) : (
        /* Standard Joyful Anime Kawaii Eyes */
        <g filter="url(#cyanEyeGlow)">
          {/* Left Eye */}
          <ellipse cx="45" cy="43" rx="6.5" ry="8.5" fill="url(#glowEye)" />
          <circle cx="43" cy="40" r="2.8" fill="#FFFFFF" />
          <circle cx="47" cy="46" r="1.4" fill="#FFFFFF" />

          {/* Right Eye */}
          <ellipse cx="75" cy="43" rx="6.5" ry="8.5" fill="url(#glowEye)" />
          <circle cx="73" cy="40" r="2.8" fill="#FFFFFF" />
          <circle cx="77" cy="46" r="1.4" fill="#FFFFFF" />
        </g>
      )}

      {/* Cute Neon Cyan Anime Smile */}
      <path
        d="M56 50 Q60 54 64 50"
        stroke="#67E8F9"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        filter="url(#cyanEyeGlow)"
      />

      {/* Forehead Glowing Purple Neon / Pink Diamond Gem */}
      <polygon
        points="60,20 63.5,24 60,28 56.5,24"
        fill="#F472B6"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        filter="url(#purpleNeonGlow)"
      />
    </svg>
  );
}
