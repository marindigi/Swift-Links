import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  theme: 'light' | 'dark';
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({ isOpen, onClose, onUpgrade, theme }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "relative w-full max-w-md p-8 rounded-[32px] border shadow-2xl overflow-hidden text-center",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand">
              <Zap size={32} />
            </div>
            <h3 className={cn(
              "text-2xl font-display font-bold mb-3",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Free plan limit reached
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Free plan users can create a maximum of 3 notes. Upgrade to Pro to create unlimited notes and unlock more features.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onClose();
                  onUpgrade?.();
                }}
                className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                Upgrade to Pro
                <ArrowRight size={18} />
              </button>
              <button
                onClick={onClose}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all",
                  theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                )}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
