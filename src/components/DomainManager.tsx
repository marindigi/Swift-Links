import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, X, Plus, Search, Trash2, CheckCircle, AlertCircle, Clock, RefreshCw, Copy } from 'lucide-react';
import { Button } from './Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Domain } from '../types';

import { toast } from 'react-hot-toast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DomainManagerProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onVerify: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
  standalone?: boolean;
}

export const DomainManager: React.FC<DomainManagerProps> = ({
  isOpen,
  onClose,
  domains,
  onAdd,
  onDelete,
  onVerify,
  theme,
  standalone = false
}) => {
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(newDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    setIsAdding(true);
    try {
      await onAdd(newDomain);
      setNewDomain('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      // Error handled by parent
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await onVerify(id);
    } catch (error) {
      // Error handled by parent
    } finally {
      setVerifyingId(null);
    }
  };

  const content = (
    <div className={cn(
      "relative w-full transition-colors",
      !standalone && "max-w-lg border rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar",
      !standalone && (theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"),
      standalone && "p-0"
    )}>
      {!standalone && (
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className={cn(
            "text-xl sm:text-2xl font-display font-bold flex items-center gap-3 transition-colors",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            <Globe className="text-brand" size={24} />
            Custom Domains
          </h2>
          <button 
            onClick={onClose} 
            className={cn(
              "p-2 rounded-xl transition-colors",
              theme === 'dark' ? "text-gray-500 hover:text-white hover:bg-white/5" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleAdd} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text"
            placeholder="e.g. my-links.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={isAdding || !!deletingId}
            className={cn(
              "flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand/50 transition-all disabled:opacity-50 text-sm outline-none",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
            )}
          />
          <Button 
            type="submit"
            isLoading={isAdding}
            disabled={isAdding || !!deletingId || !newDomain}
            className="shrink-0"
          >
            <Plus size={18} className="mr-2" />
            <span>Add Domain</span>
          </Button>
        </div>
        <p className="text-[10px] text-gray-500 mt-3 px-1 uppercase tracking-widest font-bold">Branded links build trust</p>
      </form>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-brand/50 transition-all outline-none",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
            )}
          />
        </div>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {domains.filter(d => (d.name || '').toLowerCase().includes(search.toLowerCase())).length === 0 ? (
          <div className="text-center py-8 text-gray-600 italic">
            {search ? 'No domains match your search.' : 'No custom domains added yet.'}
          </div>
        ) : (
          domains
            .filter(d => (d.name || '').toLowerCase().includes(search.toLowerCase()))
            .map(domain => (
              <div 
                key={domain.id} 
                className={cn(
                  "flex flex-col p-4 border rounded-2xl group transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-gray-100 hover:border-emerald-200 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className={cn(
                        "font-medium transition-colors truncate max-w-[150px] sm:max-w-none block",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>{domain.name}</span>
                      {domain.expiresAt && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          Expires: {new Date(domain.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {domain.status && (
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1.5",
                        domain.status === 'verified' && (theme === 'dark' ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"),
                        domain.status === 'pending' && (theme === 'dark' ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"),
                        domain.status === 'failed' && (theme === 'dark' ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600")
                      )}>
                        {domain.status === 'verified' && <CheckCircle size={12} />}
                        {domain.status === 'pending' && <Clock size={12} />}
                        {domain.status === 'failed' && <AlertCircle size={12} />}
                        {domain.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {confirmDeleteId === domain.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <Button 
                          onClick={() => handleDelete(domain.id)}
                          isLoading={deletingId === domain.id}
                          variant="danger"
                          size="sm"
                        >
                          Confirm
                        </Button>
                        <Button 
                          onClick={() => setConfirmDeleteId(null)}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(domain.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          theme === 'dark' ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                        )}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                {(!domain.status || domain.status === 'pending' || domain.status === 'failed') && (
                  <div className={cn(
                    "mt-4 p-3 rounded-xl text-xs space-y-2",
                    theme === 'dark' ? "bg-black/40 text-gray-400" : "bg-gray-50 text-gray-600"
                  )}>
                    <p className="font-bold uppercase tracking-wider text-[10px] mb-2">Verification Required</p>
                    <p>To verify ownership, please add the following DNS TXT record to your domain:</p>
                    <div className="flex flex-col gap-1 mt-2 font-mono bg-black/10 dark:bg-white/5 p-2 rounded-lg">
                      <div className="flex justify-between">
                         <span className="opacity-70">Type:</span>
                         <span>TXT</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="opacity-70">Name:</span>
                         <span className="truncate ml-2">@ or {domain.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="opacity-70">Value:</span>
                         <div className="flex items-center gap-2">
                           <span className="truncate max-w-[150px]">{domain.verificationToken || `${domain.id}-verification-string`}</span>
                           <button 
                             type="button"
                             onClick={() => {
                               navigator.clipboard.writeText(domain.verificationToken || `${domain.id}-verification-string`);
                               toast.success('Copied to clipboard!');
                             }}
                             className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                             title="Copy to clipboard"
                           >
                             <Copy size={12} />
                           </button>
                         </div>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] opacity-70">
                      DNS propagation can take up to 24-48 hours, but usually happens within minutes.
                    </p>
                    <Button
                      onClick={() => handleVerify(domain.id)}
                      isLoading={verifyingId === domain.id}
                      className="mt-3 w-full"
                    >
                      <RefreshCw size={14} className={cn("mr-2", verifyingId === domain.id && "animate-spin")} />
                      <span>Verify Domain Now</span>
                    </Button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg"
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
