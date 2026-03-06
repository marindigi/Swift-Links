import React from 'react';
import { X, Smartphone, Monitor, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ClicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  clicks: any[];
  theme: 'light' | 'dark';
}

export const ClicksModal: React.FC<ClicksModalProps> = ({ isOpen, onClose, clicks, theme }) => {
  const uniqueClicks = React.useMemo(() => {
    if (!Array.isArray(clicks)) return [];
    return Array.from(new Map(clicks.map(c => [c.id || Math.random(), c])).values());
  }, [clicks]);

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
              "relative w-full max-w-4xl max-h-[80vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col",
              theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
            )}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>All Clicks</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className={theme === 'dark' ? "text-gray-400" : "text-gray-600"} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className={theme === 'dark' ? "text-gray-400" : "text-gray-500"}>
                    <th className="pb-4">DATE</th>
                    <th className="pb-4">LOCATION</th>
                    <th className="pb-4">DEVICE</th>
                    <th className="pb-4">BROWSER</th>
                    <th className="pb-4">OS</th>
                  </tr>
                </thead>
                <tbody className={theme === 'dark' ? "text-white" : "text-gray-900"}>
                  {uniqueClicks.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((click: any, idx: number) => (
                    <tr key={click.id || idx} className={cn("border-t", theme === 'dark' ? "border-white/5" : "border-gray-100")}>
                      <td className="py-4">{new Date(click.timestamp).toLocaleString()}</td>
                      <td className="py-4 flex items-center gap-2">
                        <Globe size={12} />
                        {click.city && click.city !== 'Unknown' ? `${click.city}, ` : ''}{click.country || 'Unknown'}
                      </td>
                      <td className="py-4 flex items-center gap-2">
                        {click.device === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                        {click.device || 'desktop'}
                      </td>
                      <td className="py-4 flex items-center gap-2">
                        {click.browser || 'Unknown'}
                      </td>
                      <td className="py-4">{click.os || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
