import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  theme: 'light' | 'dark';
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm, theme }) => {
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              "relative w-full max-w-md p-8 rounded-[32px] border shadow-2xl overflow-hidden",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <h3 className={cn("text-2xl font-display font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
                Delete Account
              </h3>
            </div>

            <p className={cn(
              "mb-8 text-sm leading-relaxed",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              This action cannot be undone. This will permanently delete your account, all your shortened links, analytics data, and custom domains.
            </p>

            <div className="mb-8">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">
                Please type <span className="text-red-500 font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all font-mono",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
                placeholder="DELETE"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-bold transition-all",
                  theme === 'dark' ? "bg-white/5 text-white hover:bg-white/10" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmationText !== 'DELETE'}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
                Delete Permanently
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
