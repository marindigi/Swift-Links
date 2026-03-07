import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, MousePointer2, Globe, 
  Trash2, Edit3, ExternalLink, Copy,
  AlertCircle, Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HistoryItem } from '../types';
import { Button } from './Button';
import { copyToClipboard } from '../lib/utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinkDetailsModalProps {
  item: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { originalUrl?: string; expiresAt?: string | null }) => Promise<void>;
}

export const LinkDetailsModal: React.FC<LinkDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  theme,
  onDelete,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(item?.originalUrl || '');
  const [editExpiresAt, setEditExpiresAt] = useState(item?.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (item) {
      setEditUrl(item.originalUrl);
      setEditExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '');
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    if (!editUrl) {
      toast.error('URL is required');
      return;
    }
    
    setIsSaving(true);
    try {
      await onUpdate(item.id, {
        originalUrl: editUrl,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null
      });
      setIsEditing(false);
      toast.success('Link updated successfully');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  const domainName = item.shortUrl.split('/')[2];

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
            className={cn(
              "relative w-full max-w-lg border rounded-[32px] overflow-hidden shadow-2xl",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h2 className={cn(
                      "text-xl font-display font-bold",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>Link Details</h2>
                    <p className="text-xs text-gray-500 font-medium">View and manage your short link</p>
                  </div>
                </div>
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

              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-2xl border",
                  theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Short URL</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          copyToClipboard(item.shortUrl, 'Copied!');
                        }}
                        className="p-1.5 rounded-lg hover:bg-brand/10 text-gray-400 hover:text-brand transition-all"
                      >
                        <Copy size={14} />
                      </button>
                      <a 
                        href={item.shortUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-brand/10 text-gray-400 hover:text-brand transition-all"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <p className={cn(
                    "text-lg font-display font-bold break-all",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {item.shortUrl.replace(/^https?:\/\//, '')}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl border",
                  theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Original URL</span>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg hover:bg-brand/10 text-gray-400 hover:text-brand transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3">
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className={cn(
                          "w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all",
                          theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                        )}
                        placeholder="Enter original URL"
                      />
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          isLoading={isSaving}
                        >
                          <Save size={14} className="mr-2" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setIsEditing(false);
                            setEditUrl(item.originalUrl);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className={cn(
                      "text-sm break-all font-medium",
                      theme === 'dark' ? "text-gray-300" : "text-gray-600"
                    )}>
                      {item.originalUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-2 gap-4">
              <div className={cn(
                "p-4 rounded-2xl border",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
              )}>
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Created</span>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
              )}>
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <MousePointer2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Clicks</span>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {item.clicks || 0}
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
              )}>
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <Globe size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Domain</span>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {domainName}
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
              )}>
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <Clock size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Expires</span>
                </div>
                {isEditing ? (
                  <input 
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className={cn(
                      "w-full bg-transparent text-xs font-bold outline-none",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}
                  />
                ) : (
                  <p className={cn(
                    "text-sm font-bold",
                    item.expiresAt ? (theme === 'dark' ? "text-amber-400" : "text-amber-600") : "text-gray-400"
                  )}>
                    {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never'}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 sm:p-8 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-4">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-1 text-xs font-bold text-red-500 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Are you sure?
                  </div>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={handleDelete}
                    isLoading={isDeleting}
                  >
                    Yes, Delete
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    <Trash2 size={16} />
                    Delete Link
                  </button>
                  <Button onClick={onClose}>
                    Close Details
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
