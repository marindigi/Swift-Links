import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Calendar, Globe, MousePointer2, Clock, Link as LinkIcon, Trash2, Loader2, Edit2, Save, Plus, Minus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tag } from '../types';
import { apiClient } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinkDetails {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  expiresAt: string | null;
  domainName: string | null;
  createdAt: string;
}

interface LinkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkDetails | null;
  theme: 'light' | 'dark';
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: { originalUrl: string; expiresAt: string | null }) => Promise<void>;
}

export const LinkDetailsModal: React.FC<LinkDetailsModalProps> = ({
  isOpen,
  onClose,
  link,
  theme,
  onDelete,
  onUpdate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalUrl, setOriginalUrl] = useState(link?.originalUrl || '');
  const [expiresAt, setExpiresAt] = useState(link?.expiresAt || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const fetchedTags = await apiClient(`/api/urls/${link.id}/tags`);
        setTags(fetchedTags);
      } catch (error) {
        console.error('Failed to fetch tags', error);
      }
    };
    fetchTags();
  }, [link.id]);

  const addTag = async () => {
    if (!newTag) return;
    try {
      const { tag } = await apiClient(`/api/urls/${link.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName: newTag }),
        successMessage: 'Tag added'
      });
      setTags([...tags, tag]);
      setNewTag('');
    } catch (error) {
      console.error('Failed to add tag', error);
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      await apiClient(`/api/urls/${link.id}/tags/${tagId}`, {
        method: 'DELETE',
        successMessage: 'Tag removed'
      });
      setTags(tags.filter(t => t.id !== tagId));
    } catch (error) {
      console.error('Failed to remove tag', error);
    }
  };

  if (!link) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(link.id, { originalUrl, expiresAt: expiresAt || null });
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
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
              "relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h3 className={cn(
                    "text-lg font-bold",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>Link Details</h3>
                  <p className="text-xs text-gray-500 font-mono">{link.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div key={tag.id} className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                      theme === 'dark' ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                    )}>
                      {tag.name}
                      <button onClick={() => removeTag(tag.id)} className="hover:text-red-500"><Minus size={12} /></button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      className={cn(
                        "p-1 rounded-lg border text-xs w-24",
                        theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    />
                    <button onClick={addTag} className="p-1 rounded-lg bg-brand text-white"><Plus size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "p-4 rounded-2xl border transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MousePointer2 size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Total Clicks</span>
                  </div>
                  <p className="text-2xl font-bold text-brand">{link.clicks}</p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Globe size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Domain</span>
                  </div>
                  <p className={cn(
                    "text-sm font-bold truncate",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>{link.domainName || window.location.hostname}</p>
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Short URL</label>
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl border font-mono text-xs",
                    theme === 'dark' ? "bg-black/40 border-white/5 text-emerald-400" : "bg-gray-50 border-gray-200 text-emerald-600"
                  )}>
                    <span className="truncate mr-4">{link.shortUrl}</span>
                    <a href={link.shortUrl} target="_blank" rel="noreferrer" className="shrink-0 hover:text-emerald-300">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">Original Destination</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-xs",
                        theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "p-3 rounded-xl border text-xs break-all",
                      theme === 'dark' ? "bg-black/40 border-white/5 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                    )}>
                      {link.originalUrl}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Created</p>
                    <p className={cn(
                      "text-xs font-medium",
                      theme === 'dark' ? "text-gray-300" : "text-gray-700"
                    )}>{new Date(link.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Expiration</p>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        value={expiresAt ? new Date(expiresAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className={cn(
                          "w-full p-1 rounded-lg border text-xs",
                          theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                        )}
                      />
                    ) : (
                      <p className={cn(
                        "text-xs font-medium",
                        link.expiresAt ? "text-amber-500" : "text-gray-500"
                      )}>
                        {link.expiresAt 
                          ? new Date(link.expiresAt).toLocaleDateString(undefined, { dateStyle: 'long' }) 
                          : 'Never'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 bg-white/5 p-6 border-t border-white/5">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-xl transition-colors",
                      theme === 'dark' ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand hover:bg-brand/10 rounded-xl transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit Link
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this link?')) {
                        setIsDeleting(true);
                        try {
                          await onDelete(link.id);
                          onClose();
                        } finally {
                          setIsDeleting(false);
                        }
                      }
                    }}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    Delete Link
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className={cn(
                      "px-6 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50",
                      theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-900 text-white hover:bg-gray-800"
                    )}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
