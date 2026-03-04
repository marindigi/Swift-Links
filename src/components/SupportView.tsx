import React from 'react';
import { MessageSquare, Mail, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupportViewProps {
  theme: 'light' | 'dark';
}

export const SupportView: React.FC<SupportViewProps> = ({ theme }) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className={cn(
          "text-3xl font-display font-bold flex items-center gap-3",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          <MessageSquare className="text-brand" size={32} />
          Technical Support
        </h2>
      </div>

      <div className={cn(
        "p-8 rounded-3xl border shadow-lg backdrop-blur-sm mb-8",
        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
      )}>
        <h3 className={cn("text-xl font-bold mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
          Need help?
        </h3>
        <p className="text-gray-500 mb-8 leading-relaxed">
          If you're experiencing issues or have questions about your account, plans, or features, our support team is here to help.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <a 
            href="https://t.me/roeunmarin" 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
              "flex flex-col items-center justify-center p-8 rounded-2xl border transition-all group",
              theme === 'dark' 
                ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-brand/50" 
                : "bg-gray-50 border-gray-200 hover:bg-white hover:border-brand hover:shadow-lg"
            )}
          >
            <div className="w-16 h-16 bg-[#0088cc]/10 text-[#0088cc] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ExternalLink size={32} />
            </div>
            <h4 className={cn("font-bold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>Telegram Support</h4>
            <p className="text-sm text-gray-500 text-center mb-4">Chat directly with our admin for instant support.</p>
            <span className="text-brand font-bold text-sm flex items-center gap-1">
              @roeunmarin <ExternalLink size={12} />
            </span>
          </a>

          <div className={cn(
            "flex flex-col items-center justify-center p-8 rounded-2xl border transition-all",
            theme === 'dark' 
              ? "bg-white/5 border-white/5" 
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Mail size={32} />
            </div>
            <h4 className={cn("font-bold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>Email Support</h4>
            <p className="text-sm text-gray-500 text-center mb-4">Send us an email and we'll get back to you within 24 hours.</p>
            <span className={cn("font-mono text-sm", theme === 'dark' ? "text-gray-300" : "text-gray-600")}>
              support@cutly.us
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
