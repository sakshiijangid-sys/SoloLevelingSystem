import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RPGProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  className?: string;
  showValue?: boolean;
}

export default function RPGProgressBar({
  value,
  max,
  label,
  color = 'bg-purple-500',
  className,
  showValue = true,
}: RPGProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center px-1">
        {label && (
          <span className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-widest">
            {label}
          </span>
        )}
        {showValue && (
          <span className="text-xs font-mono text-purple-700 dark:text-purple-400">
            {Math.round(value)} / {max}
          </span>
        )}
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded-full border border-purple-500/20 dark:border-purple-500/30 overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-colors">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full relative",
            color,
            "shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
          />
        </motion.div>
      </div>
    </div>
  );
}
