import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string | null;
  theme: 'light' | 'dark';
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, onConfirm, userEmail, theme }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
              "relative w-full max-w-md rounded-[32px] border shadow-2xl overflow-hidden",
              theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className={cn(
                "text-2xl font-display font-bold mb-4",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Delete User?
              </h3>
              <p className={cn(
                "text-base leading-relaxed mb-8",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Are you sure you want to delete <span className="font-bold text-red-500">{userEmail}</span>? This action is permanent and will delete all their links and data.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold transition-all disabled:opacity-50",
                    theme === 'dark' ? "bg-white/5 text-white hover:bg-white/10" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onConfirm();
                      onClose();
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Delete User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
