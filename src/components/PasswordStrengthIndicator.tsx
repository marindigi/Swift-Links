import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PasswordStrengthIndicatorProps {
  password: string;
  theme?: 'light' | 'dark';
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password, theme = 'light' }) => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = criteria.filter(c => c.met).length;
  const strength = metCount === 0 ? 0 : (metCount / criteria.length) * 100;

  const getStrengthColor = () => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-lime-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Medium';
    if (strength <= 80) return 'Strong';
    return 'Very Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-1">
        <span className={cn("text-xs font-bold uppercase tracking-wider", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
          Password Strength
        </span>
        <span className={cn("text-xs font-bold", 
          strength <= 20 ? "text-red-500" :
          strength <= 40 ? "text-orange-500" :
          strength <= 60 ? "text-yellow-500" :
          strength <= 80 ? "text-lime-500" :
          "text-emerald-500"
        )}>
          {getStrengthLabel()}
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          className={cn("h-full transition-all duration-300", getStrengthColor())}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors",
              criterion.met 
                ? "bg-emerald-500/10 text-emerald-500" 
                : (theme === 'dark' ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400")
            )}>
              {criterion.met ? <Check size={10} /> : <X size={10} />}
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              criterion.met 
                ? (theme === 'dark' ? "text-gray-300" : "text-gray-700")
                : "text-gray-400"
            )}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
