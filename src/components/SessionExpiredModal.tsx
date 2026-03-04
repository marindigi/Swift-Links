import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onLogin: () => void;
  theme: 'light' | 'dark';
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ isOpen, onLogin, theme }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full max-w-md p-6 rounded-2xl shadow-xl border ${
              theme === 'dark' ? 'bg-[#111] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertCircle size={24} />
              </div>
              
              <h2 className="text-xl font-bold">Session Expired</h2>
              
              <p className="text-sm text-gray-500">
                Your session has expired. Please log in again to continue.
                Don't worry, your work is safe.
              </p>

              <Button
                variant="primary"
                onClick={onLogin}
                className="w-full mt-4"
              >
                <LogIn size={18} className="mr-2" />
                Log In Again
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
