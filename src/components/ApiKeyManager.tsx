import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Plus, Trash2, Loader2, Copy, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { ApiKey } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKey[];
  onGenerate: (name: string) => Promise<ApiKey>;
  onDelete: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
}

export function ApiKeyManager({ 
  apiKeys, 
  onGenerate, 
  onDelete,
  theme 
}: Omit<ApiKeyManagerProps, 'isOpen' | 'onClose'>) {
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    try {
      const newKey = await onGenerate(newKeyName);
      setGeneratedKey(newKey.key);
      setNewKeyName('');
      toast.success('API Key generated successfully');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await onDelete(id);
      toast.success('API Key deleted successfully');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="w-full">
      {generatedKey ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5",
          )}
        >
          <div className="flex items-center gap-3 mb-4 text-emerald-500">
            <Key size={24} />
            <h3 className="font-bold text-lg">New API Key Generated</h3>
          </div>
          <p className={cn(
            "mb-4 text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Please copy your API key now. For security reasons, it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className={cn(
              "flex-1 p-3 rounded-xl font-mono text-sm break-all",
              theme === 'dark' ? "bg-black/50 text-emerald-400" : "bg-white text-emerald-600 border border-emerald-100"
            )}>
              {generatedKey}
            </code>
            <button
              onClick={() => copyToClipboard(generatedKey)}
              className={cn(
                "p-3 rounded-xl transition-colors shrink-0",
                theme === 'dark' ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              )}
            >
              <Copy size={18} />
            </button>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            className={cn(
              "mt-6 w-full py-3 rounded-xl font-bold transition-colors",
              theme === 'dark' ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            I have saved my key
          </button>
        </motion.div>
      ) : (
        <>
          <form onSubmit={handleGenerate} className="mb-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text"
                  placeholder="Key Name (e.g. Production App)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={isGenerating}
                  className={cn(
                    "flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand/50 transition-all disabled:opacity-50 text-sm outline-none",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  )}
                />
                <button 
                  type="submit"
                  disabled={isGenerating || !newKeyName.trim()}
                  className={cn(
                    "font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-brand/20 flex items-center justify-center gap-2 shrink-0",
                    theme === 'dark' ? "bg-brand text-white hover:bg-brand-hover" : "bg-brand text-white hover:bg-brand-hover"
                  )}
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  <span>Generate Key</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 px-1 uppercase tracking-widest font-bold">
                API keys allow you to authenticate requests to the cutly.us API. Keep them secure.
              </p>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className={cn(
              "text-sm font-bold uppercase tracking-wider mb-4",
              theme === 'dark' ? "text-gray-500" : "text-gray-400"
            )}>Active Keys</h3>
            
            {apiKeys.length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic border border-dashed rounded-2xl border-gray-700/50">
                No API keys generated yet.
              </div>
            ) : (
              apiKeys.map(apiKey => (
                <div 
                  key={apiKey.id} 
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl group transition-all gap-4",
                    theme === 'dark' ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-gray-100 hover:border-emerald-200 shadow-sm"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "font-bold truncate",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>{apiKey.name}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-mono",
                        theme === 'dark' ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"
                      )}>
                        {apiKey.key ? `...${apiKey.key.slice(-4)}` : 'HIDDEN'}
                      </span>
                    </div>
                    <div className={cn(
                      "text-xs",
                      theme === 'dark' ? "text-gray-500" : "text-gray-400"
                    )}>
                      Created on {new Date(apiKey.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {confirmDeleteId === apiKey.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <button 
                          onClick={() => handleDelete(apiKey.id)}
                          disabled={!!isDeletingId}
                          className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-2 rounded-lg bg-red-400/10 flex items-center gap-2"
                        >
                          {isDeletingId === apiKey.id ? <Loader2 className="animate-spin" size={14} /> : <AlertTriangle size={14} />}
                          Confirm
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className={cn(
                            "text-xs px-3 py-2 rounded-lg transition-colors",
                            theme === 'dark' ? "text-gray-500 hover:text-white hover:bg-white/5" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                          )}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(apiKey.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          theme === 'dark' ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                        )}
                        title="Revoke Key"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
