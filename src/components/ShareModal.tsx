import React from 'react';
import { motion } from 'motion/react';
import { Share2, X, Copy, Twitter, Facebook, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string | null;
  theme: 'light' | 'dark';
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, theme }) => {
  if (!isOpen || !shareUrl) return null;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this link!')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    email: `mailto:?subject=${encodeURIComponent('Check out this link!')}&body=${encodeURIComponent(`Here is a shortened link: ${shareUrl}`)}`
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={cn(
          "w-full max-w-md border rounded-3xl p-8 shadow-2xl transition-colors",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand/10 rounded-xl">
              <Share2 className="text-brand" size={20} />
            </div>
            <h2 className={cn(
              "text-2xl font-display font-bold transition-colors",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>Share Link</h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              theme === 'dark' ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-900"
            )}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className={cn(
            "p-4 border rounded-2xl transition-colors",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Shortened URL</p>
            <div className="flex items-center justify-between gap-4">
              <span className={cn(
                "font-mono text-sm truncate transition-colors",
                theme === 'dark' ? "text-brand" : "text-brand"
              )}>{shareUrl}</span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success('Copied!');
                  } catch (error) {
                    toast.error('Failed to copy');
                  }
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors shrink-0",
                  theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                )}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all hover:scale-105",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2]" : "bg-white border-gray-100 hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2] shadow-sm"
              )}
            >
              <Twitter size={24} />
              <span className="text-xs font-bold">Twitter</span>
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all hover:scale-105",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-[#4267B2]/10 hover:border-[#4267B2]/50 hover:text-[#4267B2]" : "bg-white border-gray-100 hover:border-[#4267B2]/50 hover:text-[#4267B2] shadow-sm"
              )}
            >
              <Facebook size={24} />
              <span className="text-xs font-bold">Facebook</span>
            </a>
            <a
              href={shareLinks.email}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all hover:scale-105",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-gray-500/10 hover:border-gray-500/50 hover:text-gray-400" : "bg-white border-gray-100 hover:border-gray-500/50 hover:text-gray-600 shadow-sm"
              )}
            >
              <Mail size={24} />
              <span className="text-xs font-bold">Email</span>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
