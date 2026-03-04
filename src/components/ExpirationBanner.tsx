import React from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExpirationBannerProps {
  expiresAt: string;
  onRenew: () => void;
  theme: 'light' | 'dark';
}

export const ExpirationBanner: React.FC<ExpirationBannerProps> = ({ expiresAt, onRenew, theme }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!expiresAt || !isVisible) return null;

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Only show if expiring in less than 7 days
  if (diffDays > 7 || diffDays < 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={cn(
          "w-full overflow-hidden relative z-50",
          theme === 'dark' ? "bg-amber-500/10 border-b border-amber-500/20" : "bg-amber-50 border-b border-amber-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              theme === 'dark' ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-600"
            )}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className={cn(
                "text-sm font-bold tracking-tight",
                theme === 'dark' ? "text-amber-200" : "text-amber-900"
              )}>
                Your plan expires in {diffDays} {diffDays === 1 ? 'day' : 'days'} ({expirationDate.toLocaleDateString()})
              </p>
              <p className={cn(
                "text-xs opacity-70",
                theme === 'dark' ? "text-amber-200/60" : "text-amber-700"
              )}>
                Renew now to keep your custom domains and advanced features active.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onRenew}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              Renew Plan
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className={cn(
                "p-2 rounded-lg transition-all",
                theme === 'dark' ? "text-amber-500/40 hover:text-amber-500 hover:bg-amber-500/10" : "text-amber-400 hover:text-amber-600 hover:bg-amber-100"
              )}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
