import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Calendar, Globe, MousePointer2, Clock, Link as LinkIcon, Trash2, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinkDetails {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  expiresAt: string | null;
  domainName: string | null;
  createdAt: string;
}

interface LinkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkDetails | null;
  theme: 'light' | 'dark';
  onDelete: (id: string) => Promise<void>;
}

export const LinkDetailsModal: React.FC<LinkDetailsModalProps> = ({
  isOpen,
  onClose,
  link,
  theme,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!link) return null;

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h3 className={cn(
                    "text-lg font-bold",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>Link Details</h3>
                  <p className="text-xs text-gray-500 font-mono">{link.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "p-4 rounded-2xl border transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MousePointer2 size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Total Clicks</span>
                  </div>
                  <p className="text-2xl font-bold text-brand">{link.clicks}</p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Globe size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Domain</span>
                  </div>
                  <p className={cn(
                    "text-sm font-bold truncate",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>{link.domainName || window.location.hostname}</p>
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Short URL</label>
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl border font-mono text-xs",
                    theme === 'dark' ? "bg-black/40 border-white/5 text-emerald-400" : "bg-gray-50 border-gray-200 text-emerald-600"
                  )}>
                    <span className="truncate mr-4">{link.shortUrl}</span>
                    <a href={link.shortUrl} target="_blank" rel="noreferrer" className="shrink-0 hover:text-emerald-300">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Original Destination</label>
                  <div className={cn(
                    "p-3 rounded-xl border text-xs break-all",
                    theme === 'dark' ? "bg-black/40 border-white/5 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                  )}>
                    {link.originalUrl}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Created</p>
                    <p className={cn(
                      "text-xs font-medium",
                      theme === 'dark' ? "text-gray-300" : "text-gray-700"
                    )}>{new Date(link.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Expiration</p>
                    <p className={cn(
                      "text-xs font-medium",
                      link.expiresAt ? "text-amber-500" : "text-gray-500"
                    )}>
                      {link.expiresAt 
                        ? new Date(link.expiresAt).toLocaleDateString(undefined, { dateStyle: 'long' }) 
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 bg-white/5 p-6 border-t border-white/5">
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this link?')) {
                    setIsDeleting(true);
                    try {
                      await onDelete(link.id);
                      onClose();
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                Delete Link
              </button>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50",
                  theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-900 text-white hover:bg-gray-800"
                )}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
