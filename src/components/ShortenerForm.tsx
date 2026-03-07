import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, ArrowRight, Loader2, Check, Copy, ExternalLink, History, Download, Globe, X, Calendar, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { apiClient } from '../lib/api';
import { copyToClipboard } from '../lib/utils';
import { nanoid } from 'nanoid';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShortenerFormProps {
  theme: 'light' | 'dark';
  onSuccess?: (item: any) => void;
  domains: any[];
}

export const ShortenerForm: React.FC<ShortenerFormProps> = ({ theme, onSuccess, domains }) => {
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Bulk mode states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkType, setBulkType] = useState<'repeat' | 'list'>('repeat');
  const [bulkUrlList, setBulkUrlList] = useState('');
  const [bulkCount, setBulkCount] = useState(100);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkUrls, setBulkUrls] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);
  const [bulkErrorCount, setBulkErrorCount] = useState(0);
  const [bulkTotalCount, setBulkTotalCount] = useState(0);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [bulkFailedUrls, setBulkFailedUrls] = useState<{url: string, error: string}[]>([]);
  const [isFailedUrlsExpanded, setIsFailedUrlsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBulkMode) return handleBulkSubmit(e);
    
    setLoading(true);
    setHasError(false);
    setShortUrl(null);

    try {
      new URL(url);
      const data = await apiClient<{ id: string; domainName: string | null }>('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, domainId: selectedDomainId || undefined, expiresAt: expiresAt || undefined }),
        errorMessage: 'Failed to shorten link'
      });

      const domain = data.domainName || window.location.host;
      const protocol = window.location.protocol;
      const constructedShortUrl = `${protocol}//${domain}/${data.id}`;

      setShortUrl(constructedShortUrl);
      
      const newItem = {
        id: data.id,
        originalUrl: url,
        shortUrl: constructedShortUrl,
        timestamp: Date.now(),
      };

      if (onSuccess) onSuccess(newItem);
      
      toast.success('Link shortened!');
      setUrl('');
    } catch (error: any) {
      setHasError(true);
      const errorMessage = error?.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('Invalid URL')) {
        toast.error('Please enter a valid URL');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkUrls([]);
    setBulkProgress(0);
    setBulkSuccessCount(0);
    setBulkErrorCount(0);
    setBulkFailedUrls([]);
    setBulkTotalCount(0);

    try {
      let urlsToShorten: string[] = [];
      if (bulkType === 'repeat') {
        try { new URL(url); } catch {
          toast.error('Please enter a valid URL');
          setBulkLoading(false);
          return;
        }
        urlsToShorten = Array(Math.min(Math.max(bulkCount, 1), 1000)).fill(url);
      } else {
        const rawUrls = bulkUrlList.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        if (rawUrls.length === 0) {
          toast.error('Please enter at least one URL');
          setBulkLoading(false);
          return;
        }

        const invalidUrls = rawUrls.filter(u => {
          try {
            new URL(u);
            return false;
          } catch {
            return true;
          }
        });

        if (invalidUrls.length > 0) {
          toast.error(`${invalidUrls.length} invalid URL(s) detected`);
          setBulkFailedUrls(invalidUrls.map(u => ({ url: u, error: 'Invalid URL format' })));
          setBulkErrorCount(invalidUrls.length);
          setBulkTotalCount(rawUrls.length);
          setBulkProgress(100);
          setBulkLoading(false);
          return;
        }
        urlsToShorten = rawUrls;
      }

      setBulkTotalCount(urlsToShorten.length);
      const batchSize = 20;
      const allUrls: string[] = [];
      
      for (let i = 0; i < urlsToShorten.length; i += batchSize) {
        const batch = urlsToShorten.slice(i, i + batchSize);
        
        try {
          const result = await apiClient<{ ids: string[], domainName: string | null, results: { id?: string, url: string, error?: string }[] }>('/api/bulk-shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: batch, domainId: selectedDomainId || undefined, expiresAt: expiresAt || undefined }),
            showToast: false
          });

          const domain = result.domainName || window.location.host;
          const protocol = window.location.protocol;
          const shortUrls = result.ids.map(id => `${protocol}//${domain}/${id}`);
          
          allUrls.push(...shortUrls);
          setBulkUrls(prev => [...prev, ...shortUrls]);

          const batchSuccessCount = result.results.filter(r => r.id).length;
          const batchErrorCount = result.results.filter(r => r.error).length;
          const batchErrors = result.results.filter(r => r.error).map(r => ({ url: r.url, error: r.error! }));

          setBulkSuccessCount(prev => prev + batchSuccessCount);
          setBulkErrorCount(prev => prev + batchErrorCount);
          setBulkFailedUrls(prev => [...prev, ...batchErrors]);
        } catch (error: any) {
          setBulkErrorCount(prev => prev + batch.length);
          setBulkFailedUrls(prev => [
            ...prev, 
            ...batch.map(u => ({ url: u, error: error.message || 'Batch failed' }))
          ]);
        }
        
        const processed = Math.min(i + batchSize, urlsToShorten.length);
        setBulkProgress((processed / urlsToShorten.length) * 100);
      }

      if (allUrls.length > 0) {
        if (onSuccess) {
          onSuccess({
            id: `bulk-${nanoid(6)}`,
            originalUrl: bulkType === 'repeat' ? url : `${urlsToShorten.length} URLs`,
            shortUrl: `${allUrls.length} links generated`,
            timestamp: Date.now(),
            isBulk: true,
            bulkUrls: allUrls
          });
        }
      }

      if (allUrls.length === urlsToShorten.length) {
        toast.success(`Successfully generated all ${allUrls.length} links!`);
        setUrl('');
        setBulkUrlList('');
      } else if (allUrls.length > 0) {
        toast.error(`Generated ${allUrls.length} links with some failures.`);
      } else {
        toast.error('Failed to generate any links.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during bulk generation');
    } finally {
      setBulkLoading(false);
    }
  };

  const copyBulkUrls = async () => {
    const success = await copyToClipboard(bulkUrls.join('\n'), 'All URLs copied!');
    if (success) {
      setBulkCopied(true);
      setTimeout(() => setBulkCopied(false), 2000);
    }
  };

  const downloadBulkUrls = () => {
    const text = bulkUrls.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutly-bulk-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handleCopyToClipboard = async (text: string) => {
    const success = await copyToClipboard(text, 'Copied!');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-2 rounded-3xl border shadow-2xl backdrop-blur-md transition-all duration-300",
          theme === 'dark' ? "bg-white/5 border-white/10 shadow-black/40" : "bg-white border-gray-100 shadow-gray-200/50"
        )}
      >
        <div className="flex items-center gap-1 p-1 mb-4 bg-gray-100/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
          <button
            onClick={() => setIsBulkMode(false)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              !isBulkMode 
                ? "bg-white dark:bg-white/10 text-brand shadow-sm border border-gray-200 dark:border-white/10" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            )}
          >
            <Link2 size={14} />
            Single Link
          </button>
          <button
            onClick={() => setIsBulkMode(true)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              isBulkMode 
                ? "bg-white dark:bg-white/10 text-brand shadow-sm border border-gray-200 dark:border-white/10" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            )}
          >
            <History size={14} />
            Bulk Mode
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-2 sm:p-4">
          {isBulkMode && (
            <div className="flex items-center gap-6 mb-6 px-2">
              <button 
                type="button"
                onClick={() => setBulkType('repeat')}
                className="flex items-center gap-2 group"
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                  bulkType === 'repeat' ? "border-brand bg-brand" : "border-gray-300 dark:border-white/20"
                )}>
                  {bulkType === 'repeat' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider transition-colors",
                  bulkType === 'repeat' ? "text-brand" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}>Repeat URL</span>
              </button>
              <button 
                type="button"
                onClick={() => setBulkType('list')}
                className="flex items-center gap-2 group"
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                  bulkType === 'list' ? "border-brand bg-brand" : "border-gray-300 dark:border-white/20"
                )}>
                  {bulkType === 'list' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider transition-colors",
                  bulkType === 'list' ? "text-brand" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}>URL List</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-3">
              {/* Domain Selector */}
              <div className="relative group">
                <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                  <Globe className={cn("transition-colors", theme === 'dark' ? "text-gray-500" : "text-gray-400")} size={18} />
                </div>
                <select
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all font-bold text-xs uppercase tracking-widest appearance-none cursor-pointer",
                    theme === 'dark' 
                      ? "bg-black/20 border-white/10 text-white focus:border-brand/50" 
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-brand/50"
                  )}
                >
                  <option value="">Default Domain ({window.location.host})</option>
                  {domains.filter(d => d.status === 'verified').map(domain => (
                    <option key={domain.id} value={domain.id}>{domain.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none">
                  <ArrowRight className="rotate-90 text-gray-500" size={14} />
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Expiration Date & Time (Optional)</label>
                <div className="absolute left-4 top-8 flex items-center pointer-events-none">
                  <Calendar className={cn("transition-colors", theme === 'dark' ? "text-gray-500" : "text-gray-400")} size={18} />
                </div>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all font-bold text-xs uppercase tracking-widest",
                    theme === 'dark' 
                      ? "bg-black/20 border-white/10 text-white focus:border-brand/50" 
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-brand/50"
                  )}
                />
              </div>

              <div className="relative group">
              <div className={cn("absolute left-4 flex items-center pointer-events-none", bulkType === 'list' && isBulkMode ? "top-4" : "inset-y-0")}>
                <Link2 className={cn("transition-colors", hasError ? "text-red-500" : "text-gray-400 group-focus-within:text-brand")} size={20} />
              </div>
              {isBulkMode && bulkType === 'list' ? (
                <textarea
                  placeholder="Paste your list of URLs here (one per line)..."
                  value={bulkUrlList}
                  onChange={(e) => { setBulkUrlList(e.target.value); setHasError(false); setShortUrl(null); }}
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-medium text-lg min-h-[120px] resize-y",
                    theme === 'dark' ? "bg-black/20 border-white/10 text-white focus:border-brand/50" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-brand/50",
                    hasError && "border-red-500 focus:border-red-500 ring-2 ring-red-500/20"
                  )}
                  required
                />
              ) : (
                <>
                  <input
                    type="url"
                    placeholder="e.g., https://example.com/very-long-url-that-needs-shortening"
                    value={url}
                    onChange={(e) => { 
                      setUrl(e.target.value); 
                      setHasError(false); 
                      setShortUrl(null); 
                    }}
                    className={cn(
                      "w-full pl-12 pr-12 py-4 rounded-2xl border outline-none transition-all font-medium text-lg",
                      theme === 'dark' 
                        ? "bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-brand/50 focus:bg-black/40" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-brand/50 focus:bg-white",
                      hasError && "border-red-500 focus:border-red-500 ring-4 ring-red-500/10",
                      !hasError && url.length > 0 && (
                        (() => {
                          try { new URL(url); return true; } catch { return false; }
                        })() ? "border-emerald-500 focus:border-emerald-500 ring-4 ring-emerald-500/10" : "border-amber-500 focus:border-amber-500 ring-4 ring-amber-500/10"
                      )
                    )}
                    required
                  />
                  {url.length > 0 && (
                    <p className={cn(
                      "mt-2 text-xs font-bold flex items-center gap-1",
                      hasError ? "text-red-500" : 
                      ((() => { try { new URL(url); return true; } catch { return false; } })() ? "text-emerald-500" : "text-amber-500")
                    )}>
                      {hasError ? "Invalid URL format." : 
                       ((() => { try { new URL(url); return true; } catch { return false; } })() ? "Valid URL." : "Please enter a valid URL.")}
                    </p>
                  )}
                  {url && (
                    <button
                      type="button"
                      onClick={() => { setUrl(''); setHasError(false); setShortUrl(null); }}
                      className="absolute right-4 inset-y-0 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={18} />
                    </button>
                  )}
                </>
              )}
              {hasError && (
                <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                  <X size={12} />
                  Invalid URL. Please check your link and try again.
                </p>
              )}
              {isBulkMode && bulkType === 'repeat' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Count</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000" 
                      value={bulkCount} 
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 100)} 
                      className={cn(
                        "w-14 py-0.5 px-1 rounded-lg text-sm font-black text-center outline-none border-none bg-transparent", 
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
              type="submit"
              disabled={loading || bulkLoading || (!url && bulkType === 'repeat') || (!bulkUrlList && bulkType === 'list')}
              className={cn(
                "px-8 py-4 bg-brand text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 min-w-[140px] group disabled:opacity-70 disabled:cursor-not-allowed",
                !(loading || bulkLoading) && "hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {loading || bulkLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>{isBulkMode ? 'Generate' : 'Shorten'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {(bulkLoading || bulkTotalCount > 0) && isBulkMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-6"
            >
              <div className={cn(
                "p-5 rounded-2xl border space-y-4",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                      bulkLoading ? "bg-brand animate-pulse" : bulkErrorCount > 0 ? "bg-amber-500" : "bg-emerald-500"
                    )}>
                      {bulkLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {bulkLoading ? 'Processing Bulk Request...' : 'Bulk Generation Complete'}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                        {bulkSuccessCount} successful • {bulkErrorCount} failed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-black text-brand">{Math.round(bulkProgress)}%</p>
                  </div>
                </div>

                <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bulkSuccessCount / bulkTotalCount) * 100}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                  />
                  <motion.div 
                    className="h-full bg-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bulkErrorCount / bulkTotalCount) * 100}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                  />
                </div>

                {!bulkLoading && bulkUrls.length > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={copyBulkUrls}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                        bulkCopied ? "bg-emerald-500 text-white" : theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {bulkCopied ? <Check size={14} /> : <Copy size={14} />}
                      {bulkCopied ? 'Copied All' : 'Copy All Links'}
                    </button>
                    <button 
                      onClick={downloadBulkUrls}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                        theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <Download size={14} />
                      Download TXT
                    </button>
                  </div>
                )}

                {!bulkLoading && bulkFailedUrls.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                    <button 
                      onClick={() => setIsFailedUrlsExpanded(!isFailedUrlsExpanded)}
                      className="flex items-center justify-between w-full text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2"
                    >
                      <span>Failed URLs ({bulkFailedUrls.length})</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = bulkFailedUrls.map(f => `${f.url}: ${f.error}`).join('\n');
                            navigator.clipboard.writeText(text);
                            toast.success('Failed URLs copied to clipboard');
                          }}
                          className="text-[10px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 uppercase tracking-widest"
                        >
                          Copy
                        </button>
                        <ChevronDown size={12} className={cn("transition-transform", isFailedUrlsExpanded && "rotate-180")} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isFailedUrlsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                            {bulkFailedUrls.map((item, idx) => (
                              <div key={`failed-url-${item.url}-${idx}`} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                <span className="truncate text-gray-500 max-w-[70%]">{item.url}</span>
                                <span className="text-red-500 font-bold">{item.error}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {shortUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              "mt-8 p-6 rounded-[32px] border shadow-2xl backdrop-blur-md relative overflow-hidden",
              theme === 'dark' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-100"
            )}
          >
            {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5 w-full sm:w-auto overflow-hidden">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 shrink-0 transform -rotate-3">
                  <Check size={28} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                      Success
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link is ready</span>
                  </div>
                  <a 
                    href={shortUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className={cn(
                      "text-2xl font-display font-bold truncate block hover:text-brand transition-colors", 
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}
                  >
                    {shortUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleCopyToClipboard(shortUrl)}
                  className={cn(
                    "flex-1 sm:flex-none px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg",
                    copied 
                      ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                      : theme === 'dark' 
                        ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" 
                        : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-gray-200/50"
                  )}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "p-3.5 rounded-2xl transition-all shadow-lg",
                    theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-gray-200/50"
                  )}
                  title="Open Link"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
