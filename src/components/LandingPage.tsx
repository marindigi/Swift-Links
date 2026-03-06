import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, ArrowRight, Loader2, Sparkles, Globe, Twitter, Sun, Moon, X, User, BarChart2, Shield, Zap, Github, Check, MessageSquare, Mail, Lock, QrCode, ChevronDown } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { apiClient } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LandingPageProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<string | void>;
  onResetPassword: (username: string) => Promise<string | void>;
  onResendVerification: (email: string) => Promise<void>;
  isLoggingIn: boolean;
}

const StripeLogo = () => (
  <svg viewBox="0 0 60 25" className="h-7 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12-1.3v-17.3h3.36l.28 1.07c.55-.52 1.4-1.18 2.9-1.18 2.7 0 4.4 2.06 4.4 5.97 0 4.28-1.54 6.15-3.9 6.15zm-.4-8.94c-1.15 0-1.92.58-2.28 1.1v4.9c.36.5 1.1.96 2.2.96 1.53 0 2.55-1.35 2.55-3.46 0-1.98-.9-3.5-2.47-3.5zM27.96 20h-4.14V5.47h4.14V20zm-2.06-16.5c-1.34 0-2.25-.9-2.25-2.14 0-1.27.9-2.14 2.25-2.14 1.34 0 2.26.87 2.26 2.14s-.92 2.14-2.26 2.14zM21.12 5.47l-3.48 1.03v13.5h-4.1V10.2l-2.05.6v-3.2l2.05-.66V5.36c0-2.58 1.16-4.6 4.4-4.6 1.1 0 2.04.2 2.64.48v3.4c-.5-.17-1-.25-1.6-.25-1.5 0-1.73.6-1.73 1.92v1.08l3.87-1.1v3.18zM6.82 15.64c0 .92.96 1.58 2.44 1.58 1.7 0 2.86-.73 2.86-2.26 0-1.3-1.07-1.93-3.12-2.78-2.6-.96-4.1-2.43-4.1-4.8 0-2.58 2.13-4.5 5.2-4.5 2.4 0 4.3.8 5.48 1.66l-1.34 3.32a6.27 6.27 0 0 0-3.82-1.17c-1.34 0-2.2.6-2.2 1.75 0 1.1.82 1.7 2.7 2.43 3.1 1.1 4.5 2.56 4.5 5.05 0 2.96-2.3 4.88-5.6 4.88-2.96 0-5.33-1.2-6.5-2.2l1.5-3.36c1.1.9 2.7 1.4 4 1.4z"/>
  </svg>
);

const VercelLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 116 100" className="h-5 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M57.5 0L115 100H0L57.5 0Z"/>
    </svg>
    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Vercel</span>
  </div>
);

const LinearLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 100 100" className="h-6 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 85c-19.3 0-35-15.7-35-35S30.7 15 50 15s35 15.7 35 35-15.7 35-35 35z"/>
      <path d="M35 65l30-30" stroke="currentColor" strokeWidth="10" strokeLinecap="round"/>
    </svg>
    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Linear</span>
  </div>
);

const AirbnbLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 32 32" className="h-7 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 1.5c-3.2 0-5.9 2.7-5.9 5.9 0 2.1 1.1 4 2.8 5.1L16 28l3.1-15.5c1.7-1.1 2.8-3 2.8-5.1 0-3.2-2.7-5.9-5.9-5.9zm0 2.5c1.9 0 3.4 1.5 3.4 3.4 0 1.3-.7 2.4-1.8 3L16 23.6l-1.6-13.2c-1.1-.6-1.8-1.7-1.8-3 0-1.9 1.5-3.4 3.4-3.4z"/>
    </svg>
    <span className="text-xl font-bold tracking-tighter" style={{ fontFamily: 'Circular, Helvetica, Arial, sans-serif' }}>airbnb</span>
  </div>
);

const NetflixLogo = () => (
  <span className="text-2xl font-black tracking-widest uppercase" style={{ fontFamily: 'Arial, sans-serif', transform: 'scaleY(1.2)', display: 'inline-block' }}>NETFLIX</span>
);

const GoogleLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 24 24" className="h-6 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
    </svg>
    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Product Sans, Arial, sans-serif' }}>Google</span>
  </div>
);

const MicrosoftLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 23 23" className="h-6 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/>
    </svg>
    <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Segoe UI, sans-serif' }}>Microsoft</span>
  </div>
);

const AmazonLogo = () => (
  <svg viewBox="0 0 103 31" className="h-8 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M66.6 24.3c-1.3-1.1-1.6-2.6-1.6-4.3 0-3.6 2.7-6.3 7.4-6.3 2.5 0 4.8.7 6.1 1.5l-.8 3.5c-1.1-.7-3.1-1.5-4.8-1.5-1.9 0-2.8.9-2.8 2.1 0 1.2.9 1.8 2.5 1.8h.4c4.6 0 7.7 2.3 7.7 6.4 0 3.9-3.3 6.6-8.2 6.6-3.1 0-5.8-1-7.1-2l.9-3.6c1.3.9 3.5 1.9 5.8 1.9 2.2 0 3.2-1 3.2-2.3 0-1.4-1.1-1.9-3.2-1.9h-.4c-2.8-.1-4.2-1.1-5.1-1.9zm-38.5-1.5c0 4.5-2.4 7.5-6.6 7.5-1.9 0-3.5-.8-4.4-2.1l-.2 1.8H13V14h4.7v2.3c.9-1.5 2.8-2.5 4.9-2.5 4.3 0 6.5 3.1 6.5 7.5v1.5zm-4.9-.8c0-2.4-1-4.2-3.2-4.2-1.5 0-2.9.9-3.5 2.3v3.9c.6 1.4 2 2.3 3.5 2.3 2.2 0 3.2-1.9 3.2-4.3v0zm23.8-6.7c4.3 0 6.5 3.1 6.5 7.5v7h-4.9v-6.6c0-2.4-1-4.2-3.2-4.2-1.5 0-2.9.9-3.5 2.3v8.5h-4.9V14h4.7v2.3c.9-1.5 2.8-2.5 4.9-2.5h.4zm23.1 0c4.3 0 6.5 3.1 6.5 7.5v7h-4.9v-6.6c0-2.4-1-4.2-3.2-4.2-1.5 0-2.9.9-3.5 2.3v8.5h-4.9V14h4.7v2.3c.9-1.5 2.8-2.5 4.9-2.5h.4zm-48.9 5.9c0 1.6 1.2 2.7 3.2 2.7 1.4 0 2.6-.5 3.6-1.1l.9 3.3c-1.4.9-3.3 1.5-5.3 1.5-4.4 0-7.3-2.9-7.3-7.5 0-4.3 2.7-7.4 7.1-7.4 4.5 0 6.5 3.5 6.5 7.2 0 .5 0 .9-.1 1.3h-8.6zm5.1-2.9c0-1.2-.6-2.2-2-2.2-1.3 0-2.2 1-2.5 2.2h4.5zM10.9 30c-.3.1-.6.2-1 .2-1.3 0-2.2-.8-2.2-2.3V17H11v-3H7.7v-3.4H3V14H.2v3h2.8v8.3c0 3.5 2 5.3 5.3 5.3.9 0 1.8-.2 2.6-.5V30z"/>
    <path d="M99.6 20.8c-1.7 1.3-6.6 3.1-10.4 1.2-.4-.2-.8-.5-1.1-.7l-.4.6c-.3.5-.6 1-.8 1.6-.2.4-.3.9-.3 1.3 0 1.4 1.3 2.1 2.9 2.1 2.9 0 5.6-1.9 7.4-4.6.3-.4.8-.4 1.1-.1.3.3.3.8 0 1.1-2.2 3.2-5.5 5.4-9.2 5.4-2.8 0-5-1.5-5-4.2 0-.8.2-1.6.6-2.4.4-1 1-1.9 1.7-2.9.1-.1.1-.2.2-.3 4.6 1.9 9.8-.2 11.5-1.5.4-.3.4-.8.1-1.2-.3-.3-.8-.3-1.1 0l2.8 4.6z"/>
  </svg>
);

const SpotifyLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 24 24" className="h-7 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Circular, Helvetica, Arial, sans-serif' }}>Spotify</span>
  </div>
);

const IconRenderer = ({ icon, size = 24 }: { icon: string, size?: number }) => {
  switch (icon) {
    case 'Sparkles': return <Sparkles size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Shield': return <Shield size={size} />;
    case 'Globe': return <Globe size={size} />;
    case 'Activity': return <BarChart2 size={size} />;
    case 'BarChart2': return <BarChart2 size={size} />;
    case 'Lock': return <Lock size={size} />;
    case 'Cpu': return <Zap size={size} />;
    case 'Layers': return <Globe size={size} />;
    case 'MousePointer2': return <ArrowRight size={size} />;
    case 'Share2': return <Link2 size={size} />;
    case 'QrCode': return <QrCode size={size} />;
    default: return <Sparkles size={size} />;
  }
};

const FAQItem: React.FC<{ faq: any, theme: 'light' | 'dark' }> = ({ faq, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div 
      initial={false}
      className={cn(
        "rounded-2xl border transition-all overflow-hidden",
        theme === 'dark' ? "bg-[#111111] border-white/10 hover:border-white/20" : "bg-white border-gray-200 shadow-sm hover:border-gray-300"
      )}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between"
      >
        <h3 className="text-lg font-bold">{faq.question}</h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={20} className="text-gray-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6"
          >
            <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ theme, setTheme, onLogin, onSignup, onResetPassword, onResendVerification, isLoggingIn }) => {
  const [showLoginForm, setShowLoginForm] = useState(window.location.pathname === '/login');
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [mockUrl, setMockUrl] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [_selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const data = await apiClient('/api/public/settings', { showToast: false });
        setSettings(data.settings || {});
        
        const featuresData = data.features || [];
        const uniqueFeatures = Array.from(new Map(featuresData.map((f: any) => [f.id, f])).values());
        setFeatures(uniqueFeatures);

        const faqsData = data.faqs || [];
        const uniqueFaqs = Array.from(new Map(faqsData.map((f: any) => [f.id, f])).values());
        setFaqs(uniqueFaqs);
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
      }
    };
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setShowLoginForm(window.location.pathname === '/login');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePlanClick = (plan: string) => {
    setSelectedPlan(plan);
    localStorage.setItem('pendingPlan', plan);
    localStorage.setItem('pendingInterval', billingCycle);
    setIsSignup(true);
    setShowLoginForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      if (isForgotPassword) {
        const result = await onResetPassword(username);
        if (result) {
          setAuthSuccess(result);
          setIsForgotPassword(false);
        }
      } else if (isSignup) {
        if (!termsAccepted) {
          throw new Error('You must accept the Terms of Service to create an account.');
        }
        const result = await onSignup(username, password);
        if (result) {
          setAuthSuccess(result);
          setIsSignup(false);
          setPassword('');
          setFullName('');
          setCompany('');
          setTermsAccepted(false);
        }
      } else {
        await onLogin(username, password);
      }
    } catch (error: any) {
      if (error.message === 'EMAIL_NOT_CONFIRMED') {
        setAuthError('Please verify your email address before logging in.');
      } else {
        setAuthError(error.message || 'An error occurred during authentication');
      }
    }
  };

  const handleMockShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (mockUrl) {
      setIsSignup(true);
      setShowLoginForm(true);
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 selection:bg-brand/30 font-sans overflow-x-hidden relative",
      theme === 'dark' ? "bg-[#050505] text-gray-100" : "bg-[#f5f5f5] text-gray-900"
    )}>
      <Toaster position="bottom-center" />
      
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[30%] h-[30%] blur-[150px] rounded-full transition-opacity duration-1000",
          theme === 'dark' ? "bg-indigo-500/5 opacity-100" : "bg-indigo-500/5 opacity-30"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] blur-[150px] rounded-full transition-opacity duration-1000",
          theme === 'dark' ? "bg-violet-500/5 opacity-100" : "bg-violet-500/5 opacity-30"
        )} />
      </div>

      {/* Public Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        theme === 'dark' ? "bg-[#050505]/60 backdrop-blur-md border-b border-white/5" : "bg-[#f5f5f5]/60 backdrop-blur-md border-b border-black/5"
      )}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Link2 size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">{settings.site_name || "Cutly"}</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <a href="#features" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Pricing</a>
            </nav>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-lg transition-all duration-300",
                theme === 'dark' 
                  ? "bg-white/5 text-gray-400 hover:text-white" 
                  : "bg-black/5 text-gray-600 hover:text-black"
              )}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={() => { setIsSignup(false); setShowLoginForm(true); }}
              className="text-sm font-medium hover:text-indigo-600 transition-colors hidden sm:block"
            >
              Log in
            </button>
            <button 
              onClick={() => { setIsSignup(true); setShowLoginForm(true); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
            >
              Sign up free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden flex flex-col justify-center">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.1] mb-8">
              {settings.hero_title || "Shorten links,"} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                {settings.hero_subtitle || "amplify results."}
              </span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto mb-16 leading-relaxed">
              {settings.hero_description || "The enterprise-grade link management platform for modern teams. Build trust, track performance, and scale your reach."}
            </p>

            {/* Interactive URL Input */}
            <form onSubmit={handleMockShorten} className="max-w-xl mx-auto relative group">
              <div className={cn(
                "relative flex items-center p-2 rounded-2xl border shadow-sm transition-all",
                theme === 'dark' ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"
              )}>
                <div className="pl-4 text-gray-400">
                  <Link2 size={20} />
                </div>
                <input
                  type="url"
                  required
                  value={mockUrl}
                  onChange={(e) => setMockUrl(e.target.value)}
                  placeholder="Paste your long link here..."
                  className="w-full bg-transparent border-none outline-none px-4 py-3 text-base placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  Shorten <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need. <br className="hidden md:block"/> Nothing you don't.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Powerful features designed to help you manage, track, and optimize your links effortlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[320px]">
            {features.length > 0 ? (
              features.map((feature, index) => (
                <motion.div 
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "rounded-[32px] p-10 flex flex-col justify-between border relative overflow-hidden group transition-all hover:shadow-lg",
                    index % 3 === 0 ? "md:col-span-2" : "",
                    theme === 'dark' ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                      index % 3 === 0 ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : 
                      index % 3 === 1 ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" :
                      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    )}>
                      <IconRenderer icon={feature.icon} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">{feature.description}</p>
                  </div>
                  
                  {index % 3 === 0 && (
                    <div className="absolute right-0 bottom-0 w-2/3 h-2/3 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                      <div className="absolute bottom-0 right-10 flex items-end gap-3 h-full pb-10">
                        {[40, 70, 45, 90, 65, 80].map((h, i) => (
                          <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="w-12 bg-gradient-to-t from-indigo-500/20 to-indigo-500/60 rounded-t-xl"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <>
                {/* Fallback to original hardcoded features if none are defined */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={cn(
                    "md:col-span-2 rounded-[32px] p-10 flex flex-col justify-between border relative overflow-hidden group transition-all hover:shadow-lg",
                    theme === 'dark' ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center mb-6">
                      <BarChart2 size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Real-time Analytics</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">Track every click, geographic location, device type, and referring source instantly. Make data-driven decisions.</p>
                  </div>
                  
                  <div className="absolute right-0 bottom-0 w-2/3 h-2/3 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                    <div className="absolute bottom-0 right-10 flex items-end gap-3 h-full pb-10">
                      {[40, 70, 45, 90, 65, 80].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="w-12 bg-gradient-to-t from-indigo-500/20 to-indigo-500/60 rounded-t-xl"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "rounded-[32px] p-10 flex flex-col justify-between border relative overflow-hidden transition-all hover:shadow-lg",
                    theme === 'dark' ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 flex items-center justify-center mb-6">
                      <Globe size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Custom Domains</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Use your own brand's domain for a professional look and higher click-through rates.</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "rounded-[32px] p-10 flex flex-col justify-between border relative overflow-hidden transition-all hover:shadow-lg",
                    theme === 'dark' ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center mb-6">
                      <QrCode size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">QR Codes</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Generate customizable QR codes for your links instantly. Perfect for print media.</p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-500/20"
            >
              <Zap size={14} />
              <span>Flexible Plans</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Scale your links, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">not your costs.</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. From personal projects to global enterprises.
            </p>

            {/* Billing Toggle */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "text-sm font-medium transition-colors",
                  billingCycle === 'monthly' 
                    ? (theme === 'dark' ? "text-white" : "text-gray-900") 
                    : "text-gray-500"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors p-1 flex items-center",
                  billingCycle === 'yearly' ? "bg-indigo-600 justify-end" : "bg-gray-300 dark:bg-white/10 justify-start"
                )}
              >
                <motion.div 
                  layout
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "text-sm font-medium transition-colors",
                  billingCycle === 'yearly' 
                    ? (theme === 'dark' ? "text-white" : "text-gray-900") 
                    : "text-gray-500"
                )}
              >
                Yearly
              </button>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                Save 20%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Hobby Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-8 rounded-[32px] border transition-all flex flex-col h-full",
                theme === 'dark' ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 shadow-sm hover:shadow-md"
              )}
            >
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Hobby</h3>
                <p className="text-gray-500 text-sm">Perfect for side projects and personal branding.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500 text-sm">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
              </div>
              <div className="space-y-4 mb-10 flex-1">
                {[
                  { text: '50 links per month', active: true },
                  { text: 'Basic click analytics', active: true },
                  { text: 'Standard QR codes', active: true },
                  { text: '1 custom domain', active: true },
                  { text: 'API access', active: false },
                  { text: 'Advanced reporting', active: false },
                ].map((feature) => (
                  <div key={`hobby-${feature.text}`} className="flex items-center gap-3">
                    {feature.active ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-indigo-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-500/10 flex items-center justify-center shrink-0">
                        <X size={12} className="text-gray-400" />
                      </div>
                    )}
                    <span className={cn(
                      "text-sm",
                      feature.active ? (theme === 'dark' ? "text-gray-300" : "text-gray-600") : "text-gray-400 line-through"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handlePlanClick('hobby')}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold transition-all mt-auto border",
                  theme === 'dark' 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900"
                )}
              >
                Get Started
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-8 rounded-[32px] border-2 relative transition-all flex flex-col h-full transform md:-translate-y-4",
                theme === 'dark' 
                  ? "bg-[#111] border-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.15)]" 
                  : "bg-white border-indigo-600 shadow-xl shadow-indigo-600/10"
              )}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg shadow-indigo-600/20 ring-4 ring-white dark:ring-[#050505]">
                  Most Popular
                </span>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-gray-500 text-sm">For creators and growing businesses.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${billingCycle === 'monthly' ? '12' : '10'}
                  </span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Billed $120/year</p>
                )}
              </div>
              <div className="space-y-4 mb-10 flex-1">
                {[
                  { text: 'Unlimited links', active: true },
                  { text: 'Unlimited AI Notes', active: true },
                  { text: '5 Custom Domains', active: true },
                  { text: 'Advanced Analytics', active: true },
                  { text: 'Full API Access', active: true },
                  { text: 'Priority Support', active: true },
                ].map((feature) => (
                  <div key={`pro-${feature.text}`} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      theme === 'dark' ? "text-gray-200" : "text-gray-900"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handlePlanClick('pro')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 mt-auto"
              >
                Upgrade to Pro
              </button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-8 rounded-[32px] border transition-all flex flex-col h-full",
                theme === 'dark' ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 shadow-sm hover:shadow-md"
              )}
            >
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-500 text-sm">Custom solutions for large-scale operations.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${billingCycle === 'monthly' ? '49' : '39'}
                  </span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Billed $468/year</p>
                )}
              </div>
              <div className="space-y-4 mb-10 flex-1">
                {[
                  { text: 'Everything in Pro', active: true },
                  { text: 'Unlimited custom domains', active: true },
                  { text: 'Dedicated account manager', active: true },
                  { text: 'SLA guarantee', active: true },
                  { text: 'SSO & SAML integration', active: true },
                  { text: 'Custom data retention', active: true },
                ].map((feature) => (
                  <div key={`enterprise-${feature.text}`} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-violet-600" />
                    </div>
                    <span className={cn(
                      "text-sm",
                      theme === 'dark' ? "text-gray-300" : "text-gray-600"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handlePlanClick('enterprise')}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold transition-all mt-auto border",
                  theme === 'dark' 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900"
                )}
              >
                Contact Sales
              </button>
            </motion.div>
          </div>

          {/* Trust Badge / Marquee */}
          <div className="mt-24 text-center overflow-hidden">
            <p className="text-sm text-gray-400 mb-10 uppercase tracking-widest font-semibold">Trusted by innovative teams at</p>
            
            <div className="relative flex overflow-x-hidden group">
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r",
                theme === 'dark' ? "from-[#050505] to-transparent" : "from-[#f5f5f5] to-transparent"
              )} />
              <div className={cn(
                "absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l",
                theme === 'dark' ? "from-[#050505] to-transparent" : "from-[#f5f5f5] to-transparent"
              )} />
              
              <div className="flex animate-marquee whitespace-nowrap gap-16 items-center pr-16 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                {[...Array(2)].map((_, i) => (
                  <React.Fragment key={`marquee1-${i}`}>
                    <GoogleLogo />
                    <MicrosoftLogo />
                    <SpotifyLogo />
                    <AmazonLogo />
                    <StripeLogo />
                    <LinearLogo />
                    <VercelLogo />
                    <AirbnbLogo />
                    <NetflixLogo />
                  </React.Fragment>
                ))}
              </div>
              <div className="flex absolute top-0 left-0 animate-marquee2 whitespace-nowrap gap-16 items-center pr-16 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                {[...Array(2)].map((_, i) => (
                  <React.Fragment key={`marquee2-${i}`}>
                    <GoogleLogo />
                    <MicrosoftLogo />
                    <SpotifyLogo />
                    <AmazonLogo />
                    <StripeLogo />
                    <LinearLogo />
                    <VercelLogo />
                    <AirbnbLogo />
                    <NetflixLogo />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-lg">Everything you need to know about Cutly.</p>
          </div>

          <div className="space-y-4">
            {faqs.filter(f => !f.hidden).length > 0 ? (
              faqs.filter(f => !f.hidden).map((faq) => (
                <FAQItem key={faq.id} faq={faq} theme={theme} />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 italic">
                No FAQs available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn(
        "py-20 px-6 border-t mt-20",
        theme === 'dark' ? "bg-[#050505] border-white/5" : "bg-white border-gray-100"
      )}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Link2 size={18} />
                </div>
                <span className="font-display font-bold text-xl tracking-tight">{settings.site_name || "Cutly"}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8 leading-relaxed">
                The enterprise-grade link management platform for modern teams. Build trust, track performance, and scale your reach.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-all">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-all">
                  <Github size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-all">
                  <MessageSquare size={18} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-gray-500 hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-500 hover:text-indigo-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {settings.site_name || "Cutly"}. All rights reserved. Built with precision.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-gray-500 font-medium">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal Overlay */}
      <AnimatePresence>
        {showLoginForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "w-full max-w-md p-8 rounded-[32px] border shadow-2xl relative overflow-hidden",
                theme === 'dark' ? "bg-[#111] border-white/10" : "bg-white border-gray-200"
              )}
            >
              <button 
                onClick={() => setShowLoginForm(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                  <Link2 size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {isForgotPassword ? 'Reset Password' : isSignup ? 'Create Account' : 'Welcome Back'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {isForgotPassword 
                    ? 'Enter your email to reset your password.' 
                    : isSignup 
                      ? 'Start managing your links today.' 
                      : 'Sign in to your account.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authError && (
                  <div className="text-red-500 text-sm text-center mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    {authError}
                    {authError === 'Please verify your email address before logging in.' && (
                      <button 
                        type="button"
                        onClick={() => onResendVerification(username)} 
                        className="block w-full mt-2 text-xs underline hover:text-red-400"
                      >
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}

                {authSuccess && (
                  <div className="text-emerald-500 text-sm text-center mb-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    {authSuccess}
                  </div>
                )}

                {isSignup && !isForgotPassword && (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full Name"
                        className={cn(
                          "w-full pl-11 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                        )}
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company (Optional)"
                        className={cn(
                          "w-full pl-11 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                        )}
                      />
                    </div>
                  </>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="name@example.com"
                    className={cn(
                      "w-full pl-11 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    )}
                  />
                </div>
                {!isForgotPassword && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? "Create a password" : "Enter your password"}
                      className={cn(
                        "w-full pl-11 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                      )}
                    />
                  </div>
                )}
                {isSignup && !isForgotPassword && (
                  <PasswordStrengthIndicator password={password} theme={theme} />
                )}

                {!isForgotPassword && !isSignup && (
                  <div className="flex items-center justify-between pt-1 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs text-gray-500">Remember me</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {isSignup && !isForgotPassword && (
                  <div className="flex items-center pt-1 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        required
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <span className="text-xs text-gray-500">I agree to the <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a></span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" size={18} /> : null}
                  <span>{isForgotPassword ? 'Send Reset Link' : isSignup ? 'Create Account' : 'Sign In'}</span>
                </button>

                <div className="text-center mt-6">
                  <span className="text-sm text-gray-500">
                    {isForgotPassword ? 'Remember your password? ' : isSignup ? 'Already have an account? ' : "Don't have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthSuccess('');
                      if (isForgotPassword) {
                        setIsForgotPassword(false);
                      } else {
                        setIsSignup(!isSignup);
                      }
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    {isForgotPassword ? 'Back to sign in' : isSignup ? 'Sign in' : 'Sign up'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
