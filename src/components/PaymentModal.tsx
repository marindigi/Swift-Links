import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  plan: {
    id: string;
    name: string;
    price: string;
  };
  theme: 'light' | 'dark';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, plan, theme }) => {
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
              "relative w-full max-w-2xl rounded-[40px] border overflow-hidden shadow-2xl",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
          >
              <div className="flex flex-col md:flex-row">
                {/* Left Side: Plan Info */}
                <div className={cn(
                  "md:w-5/12 p-8 flex flex-col justify-between",
                  theme === 'dark' ? "bg-white/5" : "bg-gray-50"
                )}>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wider mb-6">
                      <Sparkles size={12} />
                      Selected Plan
                    </div>
                    <h2 className={cn("text-3xl font-display font-bold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>{plan.name}</h2>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className={cn("text-4xl font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>{plan.price}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        'Unlimited links',
                        'Advanced analytics',
                        'Custom domains (up to 5)',
                        'Full API access',
                        'Priority support',
                        'Password protection',
                        'Custom QR styling'
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <ShieldCheck size={16} className="text-brand" />
                      <span>Secure Payment Processing</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Contact Admin */}
                <div className="flex-1 p-8 flex flex-col justify-center items-center text-center">
                  <div className="w-full flex justify-end mb-4">
                    <button 
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-6">
                    <Zap size={40} />
                  </div>
                  
                  <h3 className={cn("text-2xl font-bold mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    Admin Activation Required
                  </h3>
                  
                  <p className="text-gray-500 mb-8 text-lg">
                    To activate the <span className="font-bold text-brand">{plan.name}</span> plan, please contact our admin on Telegram. Your account will be upgraded immediately after payment confirmation.
                  </p>
                  
                  <button 
                    onClick={async () => {
                      window.open('https://t.me/roeunmarin', '_blank');
                      if (onConfirm) {
                        try {
                          await onConfirm();
                        } catch (error) {
                          console.error('Payment confirmation failed:', error);
                        }
                      }
                      onClose();
                    }}
                    className="w-full py-4 rounded-2xl bg-[#0088cc] text-white font-bold hover:bg-[#0077b3] shadow-lg shadow-[#0088cc]/20 transition-all flex items-center justify-center gap-2"
                  >
                    Contact Admin on Telegram
                    <ArrowRight size={20} />
                  </button>
                  
                  <p className="mt-6 text-sm text-gray-400">
                    Admin Telegram: @roeunmarin
                  </p>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
