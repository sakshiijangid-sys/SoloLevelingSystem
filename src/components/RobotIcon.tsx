import React from 'react';

interface RobotIconProps {
  className?: string;
}

export default function RobotIcon({ className }: RobotIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Base shadow/glow */}
      <circle cx="50" cy="95" r="20" fill="black" fillOpacity="0.1" />

      {/* Body */}
      <path
        d="M38 78C38 75 42 72 50 72C58 72 62 75 62 78V85C62 88 58 90 50 90C42 90 38 88 38 85V78Z"
        fill="#8B5CF6"
      />
      <circle cx="50" cy="81" r="5" fill="#F472B6" fillOpacity="0.6" />

      {/* Legs/Feet */}
      <rect x="35" y="88" width="12" height="6" rx="3" fill="#6D28D9" />
      <rect x="53" y="88" width="12" height="6" rx="3" fill="#6D28D9" />

      {/* Arms */}
      <path d="M30 75L35 85" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" />
      <path d="M70 75L65 85" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" />

      {/* "Ears" / Headphones */}
      <rect x="18" y="42" width="12" height="24" rx="6" fill="#7C3AED" />
      <rect x="70" y="42" width="12" height="24" rx="6" fill="#7C3AED" />
      <circle cx="24" cy="54" r="4" fill="#F472B6" />
      <circle cx="76" cy="54" r="4" fill="#F472B6" />

      {/* Large Head */}
      <path
        d="M22 45C22 28.4315 34.536 15 50 15C65.464 15 78 28.4315 78 45V60C78 66.6274 72.6274 72 66 72H34C27.3726 72 22 66.6274 22 60V45Z"
        fill="white"
      />
      <path
        d="M22 60C22 66.6274 27.3726 72 34 72H66C72.6274 72 78 66.6274 78 60H22Z"
        fill="#DDD6FE"
      />

      {/* Eyes */}
      <ellipse cx="38" cy="48" rx="9" ry="12" fill="#1E1B4B" />
      <ellipse cx="62" cy="48" rx="9" ry="12" fill="#1E1B4B" />
      
      {/* Eye Glows */}
      <ellipse cx="38" cy="46" rx="5" ry="7" fill="#6366F1" fillOpacity="0.4" />
      <ellipse cx="62" cy="46" rx="5" ry="7" fill="#6366F1" fillOpacity="0.4" />
      
      {/* Symbol on forehead */}
      <circle cx="50" cy="28" r="7" stroke="#F472B6" strokeWidth="2" />
      <path
        d="M50 24C52.2091 24 54 25.7909 54 28C54 30.2091 52.2091 32 50 32C47.7909 32 46 30.2091 46 28"
        stroke="#F472B6"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Little Blush */}
      <rect x="28" y="58" width="5" height="2" rx="1" fill="#F472B6" fillOpacity="0.4" />
      <rect x="67" y="58" width="5" height="2" rx="1" fill="#F472B6" fillOpacity="0.4" />
      
      {/* Tiny Smile */}
      <path
        d="M47 62C47 62 48.5 64 50 64C51.5 64 53 62 53 62"
        stroke="#1E1B4B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
