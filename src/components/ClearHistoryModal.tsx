import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  theme: 'light' | 'dark';
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({ isOpen, onClose, onConfirm, theme }) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirm = async () => {
    setIsClearing(true);
    try {
      await onConfirm();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              "relative w-full max-w-sm p-8 rounded-[32px] shadow-2xl text-center border overflow-hidden",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <Trash2 size={32} />
            </div>

            <h3 className={cn("text-2xl font-display font-bold mb-3", theme === 'dark' ? "text-white" : "text-gray-900")}>
              Clear History?
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              This action cannot be undone. All your local history will be permanently removed.
            </p>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={isClearing}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl font-bold transition-all disabled:opacity-50",
                  theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isClearing}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isClearing ? <Loader2 className="animate-spin" size={18} /> : null}
                Clear All
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
