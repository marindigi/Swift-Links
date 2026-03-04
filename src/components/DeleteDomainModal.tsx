import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Domain {
  id: string;
  name: string;
}

interface DeleteDomainModalProps {
  domain: Domain | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
}

export const DeleteDomainModal: React.FC<DeleteDomainModalProps> = ({ domain, onClose, onConfirm, theme }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!domain) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={cn(
          "w-full max-w-sm border rounded-3xl p-8 shadow-2xl transition-colors",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-500/10 rounded-2xl mb-6">
            <Trash2 className="text-red-500" size={28} />
          </div>
          <h2 className={cn(
            "text-2xl font-display font-bold mb-2 transition-colors",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>Delete Domain?</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-brand">{domain.name}</span>? This will break all short links using this domain.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await onConfirm(domain.id);
                  onClose();
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
              Yes, Delete Domain
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className={cn(
                "w-full py-3.5 font-bold rounded-xl transition-colors text-sm disabled:opacity-50",
                theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
