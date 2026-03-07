import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link2, BarChart2, Globe, Key, Shield, User as UserIcon, LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from '../types';
import { ExpirationBanner } from './ExpirationBanner';
import { getSignedUrl } from '../lib/storage';
import { NotificationCenter } from './NotificationCenter';

interface DashboardLayoutProps {
  children: React.ReactNode;
  view: 'home' | 'analytics' | 'profile' | 'domains' | 'api-keys' | 'admin' | 'support';
  setView: (view: 'home' | 'analytics' | 'profile' | 'domains' | 'api-keys' | 'admin' | 'support') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User | null;
  onLogout: () => void;
  onFetchAnalytics: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  view,
  setView,
  theme,
  setTheme,
  user,
  onLogout,
  onFetchAnalytics
}) => {
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.avatar_url) {
      loadSignedAvatar(user.avatar_url);
    } else {
      setSignedAvatarUrl(null);
    }
  }, [user?.avatar_url]);

  const loadSignedAvatar = async (path: string) => {
    try {
      const url = await getSignedUrl(path);
      setSignedAvatarUrl(url);
    } catch (error) {
      console.error('Failed to load signed avatar:', error);
      setSignedAvatarUrl(null);
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 selection:bg-brand/30 font-sans overflow-x-hidden relative",
      theme === 'dark' ? "bg-[#050505] text-gray-100" : "bg-[#fcfcfc] text-gray-900"
    )}>
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={cn(
          "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-opacity duration-1000",
          theme === 'dark' ? "bg-brand/5 opacity-100" : "bg-brand/5 opacity-50"
        )} />
        <div className={cn(
          "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-opacity duration-1000",
          theme === 'dark' ? "bg-blue-500/5 opacity-100" : "bg-blue-500/5 opacity-50"
        )} />
      </div>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-50 w-64 border-r backdrop-blur-xl transition-all duration-500 hidden lg:flex flex-col",
        theme === 'dark' ? "bg-[#111111]/80 border-white/5" : "bg-white/80 border-gray-200"
      )}>
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <Link2 size={22} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Cutly</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          <button
            onClick={() => setView('home')}
            className={cn(
              "tour-shortener w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]",
              view === 'home' 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <Link2 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => {
              setView('analytics');
              onFetchAnalytics();
            }}
            className={cn(
              "tour-analytics w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]",
              view === 'analytics' 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <BarChart2 size={18} />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setView('support')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]",
              view === 'support' 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <MessageSquare size={18} />
            <span>Support</span>
          </button>
          <div className="py-4">
            <div className="h-px bg-white/5 mx-4" />
          </div>
          <button
            onClick={() => setView('domains')}
            className={cn(
              "tour-custom-domains w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]",
              view === 'domains' 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <Globe size={18} />
            <span>Custom Domains</span>
          </button>
          <button
            onClick={() => setView('api-keys')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]",
              view === 'api-keys' 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <Key size={18} />
            <span>API Keys</span>
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setView('admin')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]",
                view === 'admin' 
                  ? "bg-brand text-white shadow-lg shadow-brand/20" 
                  : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
              )}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        <div className="p-4 space-y-2">
          <button
            onClick={() => setView('profile')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              view === 'profile' 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <UserIcon size={18} />
            <span>Profile</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl lg:hidden flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar",
        theme === 'dark' ? "bg-[#050505]/90 border-white/5" : "bg-white/90 border-gray-200"
      )}>
        <button
          onClick={() => setView('home')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
            view === 'home' ? "text-brand" : "text-gray-500"
          )}
        >
          <Link2 size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button
          onClick={() => {
            setView('analytics');
            onFetchAnalytics();
          }}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
            view === 'analytics' ? "text-brand" : "text-gray-500"
          )}
        >
          <BarChart2 size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
        </button>
        <button
          onClick={() => setView('domains')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
            view === 'domains' ? "text-brand" : "text-gray-500"
          )}
        >
          <Globe size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Domains</span>
        </button>
        <button
          onClick={() => setView('api-keys')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
            view === 'api-keys' ? "text-brand" : "text-gray-500"
          )}
        >
          <Key size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">API</span>
        </button>
        <button
          onClick={() => setView('support')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
            view === 'support' ? "text-brand" : "text-gray-500"
          )}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Help</span>
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setView('admin')}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
              view === 'admin' ? "text-brand" : "text-gray-500"
            )}
          >
            <Shield size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
          </button>
        )}
        <button
          onClick={() => setView('profile')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[60px] px-2 py-1 rounded-xl transition-all shrink-0",
            view === 'profile' ? "text-brand" : "text-gray-500"
          )}
        >
          <UserIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Me</span>
        </button>
      </nav>

      {/* Header */}
      <header className={cn(
        "fixed left-0 lg:left-64 right-0 z-40 border-b backdrop-blur-xl transition-all duration-500",
        theme === 'dark' ? "bg-[#050505]/80 border-white/5" : "bg-white/80 border-gray-200",
        user && user.expiresAt && user.plan !== 'free' && 
        Math.ceil((new Date(user.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7 && 
        Math.ceil((new Date(user.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0 
          ? "top-[44px] sm:top-[48px]" 
          : "top-0"
      )}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <Link2 size={18} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Cutly</span>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
              {view === 'home' ? 'Dashboard' : view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter theme={theme} />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-xl border transition-all duration-300 shadow-sm",
                theme === 'dark' 
                  ? "bg-white/5 border-white/10 text-brand hover:bg-white/10" 
                  : "bg-white border-gray-200 text-brand hover:bg-gray-50"
              )}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block leading-tight">
                <p className="text-xs font-bold">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                  theme === 'dark' ? "bg-brand/10 text-brand" : "bg-brand/5 text-brand"
                )}>
                  {user?.plan || 'Free'}
                </span>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-lg overflow-hidden border",
                theme === 'dark' ? "border-white/10" : "border-gray-200"
              )}>
                {signedAvatarUrl ? (
                  <img 
                    src={signedAvatarUrl} 
                    alt={user?.name || 'User'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    theme === 'dark' ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"
                  )}>
                    <UserIcon size={14} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "relative z-10 pb-24 lg:pb-12 px-8 max-w-7xl mx-auto min-h-screen flex flex-col transition-all duration-500 lg:ml-64",
        user && user.expiresAt && user.plan !== 'free' && 
        Math.ceil((new Date(user.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7 && 
        Math.ceil((new Date(user.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0 
          ? "pt-40 lg:pt-32" 
          : "pt-24 lg:pt-24"
      )}>
        <div className={cn(
          "flex-1 rounded-3xl p-6 md:p-8 transition-all duration-500",
          theme === 'dark' ? "bg-[#0a0a0a]/40 border border-white/5" : "bg-white/40 border border-gray-200/50 shadow-sm"
        )}>
          <ExpirationBanner 
            expiresAt={user?.expiresAt || ''} 
            onRenew={() => setView('profile')} 
            theme={theme} 
          />
          {children}
        </div>
      </main>
    </div>
  );
};
