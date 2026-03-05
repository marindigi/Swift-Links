import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, ArrowUpDown, Trash2, Copy, Share2, ExternalLink, X, Sparkles, ChevronDown, Download, QrCode, Clock, MousePointer2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HistoryItem } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryListProps {
  history: HistoryItem[];
  theme: 'light' | 'dark';
  onDelete: (id: string) => Promise<void>;
  onClear: () => void;
  openShareModal: (url: string) => void;
  openQrModal: (url: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
  history, 
  theme, 
  onDelete, 
  onClear,
  openShareModal,
  openQrModal
}) => {
  const [historySearch, setHistorySearch] = useState('');
  const [filterExpiresAt, setFilterExpiresAt] = useState('');
  const [historySortBy, setHistorySortBy] = useState<'timestamp' | 'originalUrl' | 'shortUrl' | 'clicks'>('timestamp');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmDeleteHistoryId, setConfirmDeleteHistoryId] = useState<string | null>(null);
  const [expandedBulkId, setExpandedBulkId] = useState<string | null>(null);
  const [bulkViewMode, setBulkViewMode] = useState<'url' | 'id'>('url');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const filteredHistory = history
    .filter(item => 
      ((item.originalUrl || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.shortUrl || '').toLowerCase().includes(historySearch.toLowerCase())) &&
      (filterExpiresAt ? item.expiresAt?.startsWith(filterExpiresAt) : true)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (historySortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (historySortBy === 'originalUrl') {
        comparison = (a.originalUrl || '').localeCompare(b.originalUrl || '');
      } else if (historySortBy === 'shortUrl') {
        comparison = (a.shortUrl || '').localeCompare(b.shortUrl || '');
      } else if (historySortBy === 'clicks') {
        comparison = (a.clicks || 0) - (b.clicks || 0);
      }
      return historySortOrder === 'desc' ? -comparison : comparison;
    });

  if (history.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-12 p-8 border rounded-[32px] backdrop-blur-md w-full transition-all duration-500",
        theme === 'dark' ? "bg-white/5 border-white/10 shadow-2xl shadow-black/40" : "bg-white border-gray-100 shadow-2xl shadow-gray-200/50"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow-inner">
            <History size={24} />
          </div>
          <div>
            <h2 className={cn(
              "text-2xl font-display font-bold transition-colors",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>Recent Links</h2>
            <p className="text-xs text-gray-500 font-medium">Manage and track your shortened URLs</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text"
              placeholder="Filter history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className={cn(
                "pl-9 pr-4 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-brand/50 outline-none transition-all w-full md:w-48",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
              )}
            />
            {historySearch && (
              <button 
                onClick={() => setHistorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="relative flex-1 min-w-[150px] md:flex-none">
            <input 
              type="date"
              value={filterExpiresAt}
              onChange={(e) => setFilterExpiresAt(e.target.value)}
              className={cn(
                "px-4 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-brand/50 outline-none transition-all w-full md:w-40",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900",
                !filterExpiresAt && "text-gray-400"
              )}
              title="Filter by Expiration Date"
            />
            {filterExpiresAt && (
              <button 
                onClick={() => setFilterExpiresAt('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-1 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <ArrowUpDown size={10} />
              <span className="hidden xs:inline">Sort</span>
            </div>
            <select 
              value={historySortBy}
              onChange={(e) => setHistorySortBy(e.target.value as any)}
              className={cn(
                "bg-transparent px-2 py-1 rounded-lg text-xs font-bold outline-none transition-all cursor-pointer",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}
            >
              <option value="timestamp" className={theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"}>Date Created</option>
              <option value="originalUrl" className={theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"}>Original URL</option>
              <option value="shortUrl" className={theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"}>Short URL</option>
              <option value="clicks" className={theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"}>Clicks</option>
            </select>
            
            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
            
            <button 
              onClick={() => setHistorySortOrder(historySortOrder === 'asc' ? 'desc' : 'asc')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              )}
              title={historySortOrder === 'asc' ? "Sort Descending" : "Sort Ascending"}
            >
              <motion.div
                animate={{ rotate: historySortOrder === 'desc' ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ArrowUpDown size={14} />
              </motion.div>
            </button>
          </div>

          <button 
            onClick={onClear}
            className={cn(
              "p-2 rounded-xl border transition-colors group",
              theme === 'dark' ? "bg-white/5 border-white/10 text-gray-500 hover:text-red-400 hover:bg-red-500/10" : "bg-white border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50"
            )}
            title="Clear All History"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredHistory.length === 0 && historySearch && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
              <Search className="text-gray-400" size={20} />
            </div>
            <p className="text-sm text-gray-500 font-medium">No links found matching "{historySearch}"</p>
            <button 
              onClick={() => setHistorySearch('')}
              className="mt-2 text-xs font-bold text-brand hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}
        {filteredHistory.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "group relative p-2 border rounded-lg transition-all duration-300",
              theme === 'dark' ? "bg-black/20 border-white/5 hover:border-white/10" : "bg-gray-50 border-gray-100 hover:border-emerald-200",
              expandedBulkId === item.id && (theme === 'dark' ? "bg-black/40 border-emerald-500/30" : "bg-emerald-50/30 border-emerald-200")
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <a 
                    href={item.shortUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className={cn(
                      "text-lg font-display font-bold truncate transition-colors hover:text-brand",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}
                  >
                    {item.shortUrl?.replace ? item.shortUrl.replace(/^https?:\/\//, '') : item.shortUrl}
                  </a>
                  <div className="flex items-center gap-1.5">
                    {item.isBulk && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20">
                        <Sparkles size={10} className="text-brand" />
                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                          Bulk ({item.bulkUrls?.length || 0})
                        </span>
                      </div>
                    )}
                    {item.expiresAt && (
                      <div 
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 cursor-help"
                        title={`Expires: ${new Date(item.expiresAt).toLocaleString()}`}
                      >
                        <Clock size={10} className="text-amber-500" />
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                          Exp
                        </span>
                      </div>
                    )}
                    {item.clicks !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <MousePointer2 size={10} className="text-blue-500" />
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                          {item.clicks}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-500 truncate max-w-md font-medium">
                    {item.originalUrl}
                  </p>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {confirmDeleteHistoryId === item.id ? (
                    <div className="flex items-center gap-1 px-1 animate-in fade-in slide-in-from-right-2">
                      <button 
                        onClick={async () => {
                          setIsDeletingId(item.id);
                          try {
                            await onDelete(item.id);
                          } catch (error) {
                            toast.error('Failed to delete item');
                          } finally {
                            setIsDeletingId(null);
                            setConfirmDeleteHistoryId(null);
                          }
                        }}
                        disabled={isDeletingId === item.id}
                        className="text-[10px] font-black text-white px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 transition-colors uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                      >
                        {isDeletingId === item.id ? <Loader2 className="animate-spin" size={10} /> : null}
                        Delete
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteHistoryId(null)}
                        className={cn(
                          "text-[10px] font-bold px-2 py-1 transition-colors uppercase tracking-widest",
                          theme === 'dark' ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                        )}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      {item.isBulk && (
                        <button
                          onClick={() => setExpandedBulkId(expandedBulkId === item.id ? null : item.id)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-white text-gray-500 hover:text-gray-900 shadow-sm",
                            expandedBulkId === item.id && (theme === 'dark' ? "bg-brand/20 text-brand" : "bg-brand/10 text-brand")
                          )}
                          title={expandedBulkId === item.id ? "Hide URLs" : "View All URLs"}
                        >
                          <ChevronDown size={16} className={cn("transition-transform duration-300", expandedBulkId === item.id && "rotate-180")} />
                        </button>
                      )}
                      <button
                        onClick={() => openQrModal(item.shortUrl)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-white text-gray-500 hover:text-gray-900 shadow-sm"
                        )}
                        title="QR Code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={() => openShareModal(item.shortUrl)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-white text-gray-500 hover:text-gray-900 shadow-sm"
                        )}
                        title="Share"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(item.shortUrl);
                            toast.success('Copied to clipboard!');
                          } catch (error) {
                            toast.error('Failed to copy');
                          }
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-white text-gray-500 hover:text-gray-900 shadow-sm"
                        )}
                        title="Copy Link"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteHistoryId(item.id)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          theme === 'dark' ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-red-50 text-gray-500 hover:text-red-600 shadow-sm"
                        )}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedBulkId === item.id && item.bulkUrls && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "mt-2 pt-2 border-t",
                    theme === 'dark' ? "border-white/5" : "border-gray-100"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Generated {bulkViewMode === 'url' ? 'URLs' : 'IDs'}
                        </span>
                        <div className={cn(
                          "flex items-center p-0.5 rounded-lg border",
                          theme === 'dark' ? "bg-black/40 border-white/10" : "bg-gray-100 border-gray-200"
                        )}>
                          <button
                            onClick={() => setBulkViewMode('url')}
                            className={cn(
                              "px-2 py-0.5 text-[8px] font-bold rounded-md transition-all",
                              bulkViewMode === 'url' 
                                ? "bg-brand text-white shadow-sm" 
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            URL
                          </button>
                          <button
                            onClick={() => setBulkViewMode('id')}
                            className={cn(
                              "px-2 py-0.5 text-[8px] font-bold rounded-md transition-all",
                              bulkViewMode === 'id' 
                                ? "bg-brand text-white shadow-sm" 
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            ID
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const text = bulkViewMode === 'url' 
                              ? (item.bulkUrls?.join('\n') || '')
                              : (item.bulkUrls?.map(u => u.split('/').pop()).join('\n') || '');
                            try {
                              await navigator.clipboard.writeText(text);
                              toast.success(`All ${bulkViewMode === 'url' ? 'URLs' : 'IDs'} copied!`);
                            } catch (error) {
                              toast.error('Failed to copy');
                            }
                          }}
                          className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                          <Copy size={10} />
                          <span>Copy All {bulkViewMode === 'url' ? 'URLs' : 'IDs'}</span>
                        </button>
                        <button
                          onClick={() => {
                            const text = item.bulkUrls?.join('\n') || '';
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `cutly-bulk-${item.id}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          <Download size={10} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {item.bulkUrls.map((bUrl, idx) => {
                        const displayValue = bulkViewMode === 'url' 
                          ? (bUrl?.replace ? bUrl.replace(/^https?:\/\//, '') : bUrl)
                          : (bUrl?.split ? bUrl.split('/').pop() : '') || '';
                        
                        return (
                          <div key={`${item.id}-${idx}`} className="flex items-center justify-between group/bulk-item py-0.5">
                            <span className="text-[10px] font-mono text-gray-500 truncate flex-1">
                              {displayValue}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/bulk-item:opacity-100 transition-opacity">
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(bulkViewMode === 'url' ? bUrl : (bUrl.split('/').pop() || ''));
                                    toast.success('Copied!');
                                  } catch (error) {
                                    toast.error('Failed to copy');
                                  }
                                }}
                                className="p-1 hover:text-emerald-500 transition-colors"
                              >
                                <Copy size={10} />
                              </button>
                              {bulkViewMode === 'url' && (
                                <>
                                  <button
                                    onClick={() => openQrModal(bUrl)}
                                    className="p-1 hover:text-emerald-500 transition-colors"
                                    title="QR Code"
                                  >
                                    <QrCode size={10} />
                                  </button>
                                  <a
                                    href={bUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 hover:text-emerald-500 transition-colors"
                                  >
                                    <ExternalLink size={10} />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
