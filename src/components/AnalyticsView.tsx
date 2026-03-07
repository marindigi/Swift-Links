import React, { useState, useEffect } from 'react';
import { Loader2, BarChart2, History, Globe, Link as LinkIcon, Calendar, Filter, RefreshCw, MousePointer2, MapPin, ExternalLink, Clock, Activity, Zap, List, Smartphone, Monitor, Tablet, Cpu, Layers, Layout } from 'lucide-react';
import { ResponsiveContainer, AreaChart as ReAreaChart, Area, BarChart as ReBarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { ClicksModal } from './ClicksModal';
import { WorldMap } from './WorldMap';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyticsViewProps {
  isAnalyticsLoading: boolean;
  analyticsData: any;
  theme: 'light' | 'dark';
  setView: (view: 'home' | 'analytics') => void;
  onRefresh: (startDate?: string, endDate?: string, range?: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  isAnalyticsLoading, 
  analyticsData, 
  theme, 
  setView,
  onRefresh
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('30d');
  const [selectedReferrer, setSelectedReferrer] = useState('All');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [isClicksModalOpen, setIsClicksModalOpen] = useState(false);

  const referrers = React.useMemo(() => {
    if (!analyticsData?.clicks) return ['All'];
    const refs = new Set<string>();
    refs.add('All');
    analyticsData.clicks.forEach((click: any) => {
        let ref = 'Direct';
        if (click.referer && click.referer !== 'direct') {
          try {
            const url = new URL(click.referer);
            ref = url.hostname;
          } catch (e) {
            ref = click.referer;
          }
        }
        refs.add(ref);
    });
    return Array.from(refs);
  }, [analyticsData?.clicks]);

  const filteredClicks = React.useMemo(() => {
    if (!analyticsData?.clicks) return [];
    if (selectedReferrer === 'All') return analyticsData.clicks;
    return analyticsData.clicks.filter((click: any) => {
        let ref = 'Direct';
        if (click.referer && click.referer !== 'direct') {
          try {
            const url = new URL(click.referer);
            ref = url.hostname;
          } catch (e) {
            ref = click.referer;
          }
        }
        return ref === selectedReferrer;
    });
  }, [analyticsData?.clicks, selectedReferrer]);

  const recentClicks = React.useMemo(() => {
    if (!analyticsData?.clicks || !Array.isArray(analyticsData.clicks)) return [];
    const clicks = [...analyticsData.clicks];
    // Use a stable key for the Map to deduplicate by ID if present
    const unique = Array.from(new Map(clicks.map((c, i) => [c.id || `temp-${i}`, c])).values());
    return unique
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [analyticsData?.clicks]);

  useEffect(() => {
    if (!isAutoRefreshEnabled) return;
    
    const interval = setInterval(async () => {
      try {
        if (selectedPreset === 'custom') {
          await onRefresh(startDate, endDate);
        } else if (selectedPreset === 'all') {
          await onRefresh(undefined, undefined, 'all');
        } else {
          await onRefresh(startDate, endDate);
        }
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, selectedPreset, startDate, endDate, onRefresh]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();
    const end = formatDate(now);
    let start = '';

    if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = formatDate(d);
      setStartDate(start);
      setEndDate(end);
      onRefresh(start, end);
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = formatDate(d);
      setStartDate(start);
      setEndDate(end);
      onRefresh(start, end);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      onRefresh(undefined, undefined, 'all');
    } else {
      // Custom
      setStartDate('');
      setEndDate('');
    }
  };

  const handleFilter = () => {
    setSelectedPreset('custom');
    onRefresh(startDate, endDate);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPreset('30d');
    onRefresh(); // Defaults to 30 days in backend if no range='all'
  };

  if (isAnalyticsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-brand" size={40} />
        <p className="text-gray-500 font-medium animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData || !Array.isArray(analyticsData.urls) || analyticsData.urls.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="p-4 bg-brand/5 rounded-full inline-flex mb-6">
          <BarChart2 className="text-brand" size={40} />
        </div>
        <h3 className="text-2xl font-bold mb-2">No Data Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">Start shortening links to see your analytics dashboard come to life.</p>
        <button 
          onClick={() => setView('home')}
          className="mt-8 px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all"
        >
          Create Your First Link
        </button>
      </div>
    );
  }

  const totalClicks = (analyticsData.urls || []).reduce((acc: number, curr: any) => acc + (curr.clicks || 0), 0);
  
  const uniqueUrls = Array.isArray(analyticsData.urls) 
    ? analyticsData.urls.filter((item: any, index: number, self: any[]) =>
        index === self.findIndex((t) => t.id === item.id)
      )
    : [];

  const topUrls = [...uniqueUrls].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
  
  const clicksByDate = (filteredClicks || []).reduce((acc: any, click: any) => {
    const date = new Date(click.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(clicksByDate).map(([date, count]) => ({
    date,
    clicks: count as number
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Distribution by Country
  const countryDist = (filteredClicks || []).reduce((acc: any, click: any) => {
    const country = click.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const countryData = Object.entries(countryDist)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 7);

  const allCountryData = Object.entries(countryDist)
    .map(([name, value]) => ({ name, value: value as number }));

  // Distribution by City
  const cityDist = (filteredClicks || []).reduce((acc: any, click: any) => {
    const city = click.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const cityData = Object.entries(cityDist)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // Distribution by Referrer
  const referrerDist = (filteredClicks || []).reduce((acc: any, click: any) => {
    let ref = 'Direct';
    if (click.referer && click.referer !== 'direct') {
      try {
        const url = new URL(click.referer);
        ref = url.hostname;
      } catch (e) {
        ref = click.referer;
      }
    }
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {});

  const referrerData = Object.entries(referrerDist)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 7);

  // Distribution by Browser
  const browserDist = (filteredClicks || []).reduce((acc: any, click: any) => {
    const browser = click.browser || 'Unknown';
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {});

  const browserData = Object.entries(browserDist)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // Distribution by OS
  const osDist = (filteredClicks || []).reduce((acc: any, click: any) => {
    const os = click.os || 'Unknown';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {});

  const osData = Object.entries(osDist)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // Distribution by Device
  const deviceDist = (filteredClicks || []).reduce((acc: any, click: any) => {
    const device = click.device || 'desktop';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const deviceData = Object.entries(deviceDist)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const totalClicksInView = (filteredClicks || []).length;
  
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone size={14} />;
      case 'tablet': return <Tablet size={14} />;
      case 'desktop': return <Monitor size={14} />;
      default: return <Monitor size={14} />;
    }
  };

  const getBrowserIcon = () => {
    return <Globe size={14} />;
  };

  const getOSIcon = (os: string) => {
    const o = os.toLowerCase();
    if (o.includes('windows')) return <Layout size={14} />;
    if (o.includes('mac')) return <Cpu size={14} />;
    if (o.includes('linux')) return <Cpu size={14} />;
    if (o.includes('android')) return <Smartphone size={14} />;
    if (o.includes('ios')) return <Smartphone size={14} />;
    return <Layers size={14} />;
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      {/* Filter Bar */}
      <div className={cn(
        "p-6 rounded-2xl border backdrop-blur-sm flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden",
        theme === 'dark' ? "bg-[#0a0a0a]/80 border-white/10" : "bg-white/80 border-gray-200 shadow-sm"
      )}>
        {/* Subtle grid background for filter bar */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="flex flex-col gap-4 w-full md:w-auto flex-1 relative z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {[
                { id: '7d', label: '7 DAYS' },
                { id: '30d', label: '30 DAYS' },
                { id: 'all', label: 'ALL TIME' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all whitespace-nowrap border",
                    selectedPreset === preset.id
                      ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                      : theme === 'dark' ? "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:border-white/20" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div className={cn(
              "hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg border",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isAutoRefreshEnabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                <span className={cn("text-[10px] font-black tracking-widest uppercase", isAutoRefreshEnabled ? "text-emerald-500" : "text-gray-500")}>
                  Auto-Refresh
                </span>
              </div>
              <button
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                className={cn(
                  "relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none",
                  isAutoRefreshEnabled ? "bg-emerald-500" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    isAutoRefreshEnabled ? "translate-x-4" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-xl border text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all",
                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
              />
            </div>
            <span className="text-gray-400 text-[10px] font-black tracking-tighter">/</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-xl border text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all",
                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
              />
            </div>
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <select
                value={selectedReferrer}
                onChange={(e) => setSelectedReferrer(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-xl border text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all appearance-none cursor-pointer",
                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
              >
                {referrers.map(ref => (
                  <option key={ref} value={ref}>{ref}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-center relative z-10">
          <button 
            onClick={handleFilter}
            className="flex-1 md:flex-none px-8 py-2.5 bg-brand text-white rounded-xl text-[11px] font-black tracking-widest hover:bg-brand-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 uppercase"
          >
            <Filter size={14} />
            Apply Filter
          </button>
          <button 
            onClick={handleReset}
            className={cn(
              "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all flex items-center justify-center gap-2 border uppercase",
              theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            )}
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
            theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
          )}
        >
          {/* Visible grid line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
          
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <LinkIcon size={80} />
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-4">01 // Total Links</p>
          <h4 className="text-5xl font-mono font-bold text-brand tracking-tighter">{analyticsData.urls.length}</h4>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Active Platform Status</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
            theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
          )}
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <MousePointer2 size={80} />
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-4">02 // Total Clicks</p>
          <h4 className="text-5xl font-mono font-bold text-blue-500 tracking-tighter">{totalClicks}</h4>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Real-time Data Stream</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={cn(
            "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
            theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
          )}
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
          
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Activity size={80} />
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-4">02.5 // Unique Visitors</p>
          <h4 className="text-5xl font-mono font-bold text-purple-500 tracking-tighter">
            {new Set((analyticsData.clicks || []).map((c: any) => c.userAgent)).size}
          </h4>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Unique User Sessions</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
            theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
          )}
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <BarChart2 size={80} />
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-4">03 // Avg. Performance</p>
          <h4 className="text-5xl font-mono font-bold text-emerald-500 tracking-tighter">
            {analyticsData.urls.length > 0 ? (totalClicks / analyticsData.urls.length).toFixed(1) : "0.0"}
          </h4>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Efficiency Ratio</span>
          </div>
        </motion.div>
      </div>

      <div className={cn(
        "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
        theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
      )}>
        {/* Decorative grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <History className="text-brand" size={18} />
              Temporal Click Distribution
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand/20 border border-brand/40" />
              <span className="text-[10px] font-mono text-gray-500 uppercase">Click Intensity</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                    borderColor: theme === 'dark' ? '#ffffff10' : '#00000010',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}
                  cursor={{ fill: theme === 'dark' ? '#ffffff05' : '#00000005' }}
                />
                <Bar 
                  dataKey="clicks" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={cn(
        "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
        theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
      )}>
        {/* Decorative grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <Globe className="text-brand" size={18} />
              Geographic Distribution
            </h3>
          </div>
          <WorldMap data={allCountryData} theme={theme} />
        </div>
      </div>

      <div className={cn(
        "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
        theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
      )}>
        {/* Decorative grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <History className="text-brand" size={18} />
              Temporal Click Distribution (Area)
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand/20 border border-brand/40" />
              <span className="text-[10px] font-mono text-gray-500 uppercase">Click Intensity</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReAreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'monospace' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                    borderColor: theme === 'dark' ? '#ffffff10' : '#00000010',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}
                  cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                  animationDuration={1500}
                />
              </ReAreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Country Distribution */}
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <Globe className="text-blue-500" size={18} />
            Geographic
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {countryData.map((_entry, index) => (
                    <Cell key={`country-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                    borderColor: theme === 'dark' ? '#ffffff10' : '#00000010',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Distribution */}
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20" />
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <MapPin className="text-purple-500" size={18} />
            Top Cities
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {cityData.map((_entry, index) => (
                    <Cell key={`city-cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                    borderColor: theme === 'dark' ? '#ffffff10' : '#00000010',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Referrer Distribution */}
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <LinkIcon className="text-emerald-500" size={18} />
            Acquisition
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={referrerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {referrerData.map((_entry, index) => (
                    <Cell key={`referrer-cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                    borderColor: theme === 'dark' ? '#ffffff10' : '#00000010',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {referrerData.slice(0, 5).map((ref, index) => (
              <div key={`${ref.name}-${index}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(index + 4) % COLORS.length] }} />
                  <span className="font-mono truncate max-w-[120px]">{ref.name}</span>
                </div>
                <span className="font-bold font-mono">
                  {((ref.value / totalClicksInView) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Browser Distribution */}
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Globe size={60} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-gray-500 flex items-center gap-2">
            <Globe size={12} />
            Browsers
          </h3>
          <div className="space-y-5">
            {browserData.map((item, idx) => (
              <div key={`browser-${item.name}-${idx}`} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2">
                    {getBrowserIcon()}
                    <span className={theme === 'dark' ? "text-white" : "text-gray-900"}>{item.name}</span>
                  </div>
                  <span className="text-gray-500 font-mono">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalClicksInView > 0 ? (item.value / totalClicksInView) * 100 : 0}%` }}
                    className="h-full bg-brand"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OS Distribution */}
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Cpu size={60} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-gray-500 flex items-center gap-2">
            <Cpu size={12} />
            Operating Systems
          </h3>
          <div className="space-y-5">
            {osData.map((item, idx) => (
              <div key={`os-${item.name}-${idx}`} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2">
                    {getOSIcon(item.name)}
                    <span className={theme === 'dark' ? "text-white" : "text-gray-900"}>{item.name}</span>
                  </div>
                  <span className="text-gray-500 font-mono">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalClicksInView > 0 ? (item.value / totalClicksInView) * 100 : 0}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden group",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Smartphone size={60} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-gray-500 flex items-center gap-2">
            <Smartphone size={12} />
            Device Types
          </h3>
          <div className="space-y-5">
            {deviceData.map((item, idx) => (
              <div key={`device-${item.name}-${idx}`} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(item.name)}
                    <span className={theme === 'dark' ? "text-white" : "text-gray-900"}>{item.name}</span>
                  </div>
                  <span className="text-gray-500 font-mono">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalClicksInView > 0 ? (item.value / totalClicksInView) * 100 : 0}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
            <Zap size={40} className="text-brand" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <BarChart2 className="text-brand" size={18} />
            High-Performance Nodes
          </h3>
          <div className="space-y-3">
            {topUrls.map((url: any, idx: number) => {
              const shortUrl = `${window.location.protocol}//${url.domainId ? url.domainId : window.location.host}/${url.id}`;
              return (
                <div key={url.id} className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all group relative overflow-hidden",
                  theme === 'dark' ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                )}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-gray-500">0{idx + 1}</span>
                      <a href={shortUrl} target="_blank" rel="noreferrer" className="text-[13px] font-mono font-bold text-brand truncate hover:underline block tracking-tight">
                        {shortUrl.replace(/^https?:\/\//, '')}
                      </a>
                      <ExternalLink size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={cn("text-[11px] truncate mt-1.5 opacity-60 font-medium", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                      {url.originalUrl}
                    </p>
                  </div>
                  <div className="text-right ml-6">
                    <p className={cn("text-2xl font-mono font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-gray-900")}>{url.clicks || 0}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">Clicks</p>
                  </div>
                </div>
              );
            })}
            {topUrls.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-500/10 rounded-2xl">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No performance data available</p>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all relative overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
            <Activity size={40} className="text-emerald-500" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-emerald-500" size={18} />
              Real-time Event Stream
            </div>
            <button 
              onClick={() => setIsClicksModalOpen(true)}
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 flex items-center gap-1.5"
            >
              <List size={12} />
              View All
            </button>
          </h3>
          <div className="space-y-3">
            {recentClicks.map((click: any, idx: number) => (
              <div key={click.id || `recent-click-${idx}-${click.timestamp}`} className={cn(
                "flex items-center justify-between p-5 rounded-2xl border transition-all relative overflow-hidden group",
                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
              )}>
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[13px] font-black tracking-tight truncate", theme === 'dark' ? "text-white" : "text-gray-900")}>
                      {click.city && click.city !== 'Unknown' ? `${click.city}, ` : ''}{click.country || 'Unknown Node'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.15em] font-bold mt-1">
                      <Clock size={10} />
                      <span className="font-mono">{new Date(click.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="mx-1 opacity-30">•</span>
                      <span className="font-mono text-brand/80">{click.browser || 'Unknown'}</span>
                      <span className="mx-1 opacity-30">•</span>
                      <span className="font-mono text-brand/80">{click.device || 'desktop'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 animate-pulse">
                    LIVE
                  </span>
                </div>
              </div>
            ))}
            {recentClicks.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-500/10 rounded-2xl">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Awaiting incoming activity...</p>
              </div>
            )}
          </div>
          <ClicksModal 
            isOpen={isClicksModalOpen} 
            onClose={() => setIsClicksModalOpen(false)} 
            clicks={analyticsData.clicks}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );

};
