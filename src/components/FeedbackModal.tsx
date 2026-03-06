import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Loader2, Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, theme }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      toast.success('Feedback submitted successfully!');
      setMessage('');
      onClose();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl p-6",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <MessageSquare size={20} />
                </div>
                <h3 className={cn(
                  "text-lg font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>Send Feedback</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think or report an issue..."
                className={cn(
                  "w-full p-4 rounded-xl border text-sm min-h-[150px] resize-none outline-none focus:ring-2 focus:ring-brand/20",
                  theme === 'dark' ? "bg-black/40 border-white/5 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                )}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Submit Feedback
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
