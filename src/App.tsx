import * as React from 'react';
import { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { nanoid } from 'nanoid';
import { 
  Link2, Copy, ExternalLink, QrCode, Share2, Trash2, 
  BarChart2, Calendar, Globe, X, Loader2,
  Check, AlertCircle, ArrowRight, Download,
  Sparkles, History,
  ChevronDown, Lock, Twitter, Clock, Home
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { copyToClipboard } from './lib/utils';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { apiClient } from './lib/api';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryList } from './components/HistoryList';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './components/LandingPage';
import { DomainManager } from './components/DomainManager';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ProfileView } from './components/ProfileView';
import { OnboardingTour } from './components/OnboardingTour';

import { PaymentModal } from './components/PaymentModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AdminView } from './components/AdminView';
import { SupportView } from './components/SupportView';
import { QrCodeModal } from './components/QrCodeModal';
import { ClearHistoryModal } from './components/ClearHistoryModal';
import { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
import { LinkDetailsModal } from './components/LinkDetailsModal';
import { Domain, HistoryItem, ApiKey, User } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We encountered an unexpected error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}


export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Route detection
  const isExpiredPage = window.location.pathname === '/expired';
  const isNotFoundPage = window.location.pathname === '/not-found';
  const isUpdatePasswordPage = window.location.pathname === '/update-password';
  
  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Domain state
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  
  // API Key state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkUrls, setBulkUrls] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState(100);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkCurrentCount, setBulkCurrentCount] = useState(0);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkType, setBulkType] = useState<'repeat' | 'list'>('repeat');
  const [bulkUrlList, setBulkUrlList] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<HistoryItem | null>(null);
  const [isLinkDetailsModalOpen, setIsLinkDetailsModalOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [hasError, setHasError] = useState(false);
  
  // Payment state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null);
  
  // Analytics state
  const [view, setView] = useState<'home' | 'analytics' | 'profile' | 'admin' | 'domains' | 'api-keys' | 'support'>('home');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [user, view]);

  useEffect(() => {
    loadHistory();

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const reason = event.reason;
      console.error('Unhandled Promise Rejection:', reason);
      
      // Log more details if possible
      if (reason instanceof Error) {
        console.error('Error stack:', reason.stack);
      } else if (typeof reason === 'object' && reason !== null) {
        console.error('Error object:', JSON.stringify(reason));
      } else {
        console.error('Error reason:', String(reason));
      }
      
      // Only show toast if it's an error we haven't already handled
      const message = reason?.message || (typeof reason === 'string' ? reason : String(reason));
      if (!message.includes('aborted') && !message.includes('Canceled') && !message.includes('Unauthorized')) {
        toast.error(`An unexpected error occurred: ${message.substring(0, 50)}`);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const refreshUserData = async (firebaseUser: any) => {
    try {
      if (!firebaseUser) {
        setUser(null);
        setDomains([]);
        setApiKeys([]);
        setAnalyticsData(null);
        if (window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/expired' && window.location.pathname !== '/not-found' && window.location.pathname !== '/update-password') {
          window.history.replaceState(null, '', '/login');
        }
      } else {
        try {
          const userData = await apiClient<User>('/api/auth/me', { showToast: false });
          setUser({ ...userData, emailVerified: firebaseUser.emailVerified });
          
          fetchDomains();
          fetchApiKeys();
          fetchAnalytics();
          
          const pendingPlan = localStorage.getItem('pendingPlan');
          const pendingInterval = localStorage.getItem('pendingInterval') as 'monthly' | 'yearly';
          
          if (pendingPlan && pendingPlan !== 'hobby' && userData.plan === 'free') {
            localStorage.removeItem('pendingPlan');
            localStorage.removeItem('pendingInterval');
            handleUpgrade(pendingPlan, pendingInterval).catch(console.error);
          }

          if (userData.status === 'inactive') {
            toast.error('Your account is currently inactive. Please contact admin support.', {
              duration: 6000,
              icon: '🔒'
            });
          }
        } catch (e) {
          console.error('Failed to fetch user profile on auth change:', e);
          setUser({ id: firebaseUser.uid, email: firebaseUser.email || '', emailVerified: firebaseUser.emailVerified });
        }

        if (window.location.pathname === '/login') {
          window.history.replaceState(null, '', '/');
        }
      }
    } catch (error) {
      console.error('Auth state change error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      refreshUserData(firebaseUser).catch(console.error);
    });
    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await refreshUserData(firebaseUser);
    }
  };

  // Safety timeout for auth check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCheckingAuth) {
        setIsCheckingAuth(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isCheckingAuth]);

  const handleLogin = async (username: string, password: string) => {
    if (!username || !password) {
      throw new Error('Please enter both email and password');
    }

    setIsLoggingIn(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      
      if (userCredential.user) {
        const userData = await apiClient<User>('/api/auth/me', { showToast: false });
        if (userData && !('error' in userData)) {
          setUser(userData);
          fetchDomains();
          fetchApiKeys();
          fetchAnalytics();
          if (window.location.pathname === '/login') {
            window.history.replaceState(null, '', '/');
          }
        }
        toast.success('Successfully logged in!');
      }
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found' && error.code !== 'auth/wrong-password' && error.code !== 'auth/invalid-credential') {
        console.error('Login error:', error);
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Email or password is incorrect');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResendVerification = async (_email: string) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        toast.success('Verification email resent!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to resend verification email');
      }
    }
  };

  const handleSignup = async (username: string, password: string) => {
    if (!username || !password) {
      throw new Error('Please enter both email and password');
    }

    setIsLoggingIn(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, username, password);
      
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        const userData = await apiClient<User>('/api/auth/me', { showToast: false });
        setUser(userData);
        return 'Account created successfully! Please check your email to verify your account.';
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists. Please sign in');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetPassword = async (username: string) => {
    if (!username) {
      throw new Error('Please enter your email address');
    }

    setIsLoggingIn(true);
    try {
      // Try local reset first
      await apiClient('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username }),
        showToast: false
      });
      
      // Also trigger Firebase reset just in case they are a Firebase user
      try {
        await sendPasswordResetEmail(auth, username);
      } catch (e) {
        console.warn('Firebase reset email failed (might not be a Firebase user):', e);
      }

      return 'If an account exists, a password reset link has been sent. Please check your email.';
    } catch (error: any) {
      console.error('Reset password error:', error);
      // Fallback to Firebase if local fails or just return success message for security
      try {
        await sendPasswordResetEmail(auth, username);
        return 'If an account exists, a password reset link has been sent. Please check your email.';
      } catch (e) {
        throw error;
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await apiClient('/api/auth/logout', { method: 'POST', showToast: false }).catch(() => {});
      
      setUser(null);
      setDomains([]);
      setApiKeys([]);
      setAnalyticsData(null);
      window.history.replaceState(null, '', '/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const fetchDomains = async () => {
    try {
      const data = await apiClient<Domain[]>('/api/domains', { showToast: false });
      if (Array.isArray(data)) {
        const uniqueDomains = Array.from(new Map(data.map(d => [d.id, d])).values());
        setDomains(uniqueDomains);
      } else {
        setDomains([]);
      }
    } catch (error) {
      // Silent error for domains
    }
  };

  const fetchApiKeys = async () => {
    try {
      const data = await apiClient<ApiKey[]>('/api/keys', { showToast: false });
      if (Array.isArray(data)) {
        const uniqueKeys = Array.from(new Map(data.map(k => [k.id, k])).values());
        setApiKeys(uniqueKeys);
      } else {
        setApiKeys([]);
      }
    } catch (error) {
      // Silent error - likely auth issue or network
      console.debug('Failed to fetch API keys', error);
    }
  };

  const handleGenerateApiKey = async (name: string) => {
    const robustName = `${name} (${new Date().toLocaleString()})`;
    try {
      const newKey = await apiClient<ApiKey>('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: robustName }),
      });
      setApiKeys([...apiKeys, newKey]);
      return newKey;
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiClient(`/api/keys/${id}`, {
        method: 'DELETE',
      });
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const loadHistory = () => {
    const saved = localStorage.getItem('linkHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validHistory = parsed.filter((item: any) => item && item.id && item.originalUrl && item.shortUrl);
          // Deduplicate by id
          const uniqueHistory = Array.from(new Map(validHistory.map((item: any) => [item.id, item])).values()) as HistoryItem[];
          setHistory(uniqueHistory);
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  };

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('linkHistory', JSON.stringify(newHistory));
  };

  const deleteFromHistory = async (id: string) => {
    try {
      if (user) {
        await apiClient(`/api/urls/${id}`, { method: 'DELETE' });
      }
      const newHistory = history.filter(item => item.id !== id);
      saveHistory(newHistory);
      toast.success('Link deleted successfully');
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const handleUpdateLink = async (id: string, data: { originalUrl?: string; expiresAt?: string | null }) => {
    try {
      const updatedItem = await apiClient(`/api/urls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        successMessage: 'Link updated successfully'
      });
      
      const domain = updatedItem.domainName || window.location.host;
      const protocol = window.location.protocol;
      const constructedShortUrl = `${protocol}//${domain}/${updatedItem.id}`;

      const newItem: HistoryItem = {
        ...updatedItem,
        shortUrl: constructedShortUrl,
        timestamp: new Date(updatedItem.createdAt).getTime()
      };
      
      const newHistory = history.map(item => item.id === id ? newItem : item);
      saveHistory(newHistory);
      
      if (selectedLink?.id === id) {
        setSelectedLink(newItem);
      }
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const bulkDeleteFromHistory = async (ids: string[]) => {
    const newHistory = history.filter(item => !ids.includes(item.id));
    saveHistory(newHistory);
    toast.success(`Deleted ${ids.length} items from history`);
  };

  const clearHistory = () => {
    saveHistory([]);
    setIsClearHistoryModalOpen(false);
    toast.success('History cleared');
  };

  const handleAddDomain = async (name: string) => {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(name)) {
      toast.error('Please enter a valid domain name');
      throw new Error('Invalid domain');
    }

    try {
      const domain = await apiClient<Domain>('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        successMessage: 'Domain added successfully'
      });
      setDomains([...domains, domain]);
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await apiClient(`/api/domains/${id}`, {
        method: 'DELETE',
        successMessage: 'Domain deleted successfully'
      });
      setDomains(domains.filter(d => d.id !== id));
      if (selectedDomainId === id) setSelectedDomainId('');
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
      const result = await apiClient<{ success: boolean; status: string }>(`/api/domains/${id}/verify`, {
        method: 'POST',
        successMessage: 'Domain verified successfully'
      });
      
      setDomains(domains.map(d => 
        d.id === id ? { ...d, status: result.status as any } : d
      ));
    } catch (error) {
      // Error handled by apiClient
      throw error;
    }
  };

  const handleDismissMessage = async () => {
    if (!user) return;
    try {
      await apiClient('/api/profile/message/dismiss', { method: 'POST' });
      setUser({ ...user, message: null });
    } catch (error) {
      console.error('Failed to dismiss message', error);
    }
  };

  const handleUpgrade = async (planId: string, interval: 'monthly' | 'yearly' = 'monthly') => {
    const planName = planId === 'pro' ? 'Professional' : 'Enterprise';
    const price = planId === 'pro' ? (interval === 'yearly' ? '$120' : '$12') : (interval === 'yearly' ? '$490' : '$49');
    setSelectedPlan({ id: planId, name: planName, price });
    setIsPaymentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user?.status === 'inactive') {
      toast.error('Your account is inactive. Please contact admin support.');
      return;
    }

    if (user && !user.emailVerified) {
      toast.error('Please verify your email address to shorten links.');
      return;
    }

    if (!url.trim()) {
      toast.error('Please enter a URL to shorten');
      setHasError(true);
      return;
    }

    setLoading(true);
    setHasError(false);

    try {
      // Validate URL
      let validUrl = url.trim();
      if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = `http://${validUrl}`;
      }

      try {
        new URL(validUrl);
      } catch {
        toast.error('Please enter a valid URL (e.g., https://example.com)');
        setHasError(true);
        setLoading(false);
        return;
      }

      const data = await apiClient<{ id: string; domainName: string | null }>('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: validUrl,
          domainId: selectedDomainId || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
        }),
        errorMessage: 'Failed to shorten link'
      });

      const domain = data.domainName || window.location.host;
      const protocol = window.location.protocol;
      const constructedShortUrl = `${protocol}//${domain}/${data.id}`;

      if (!data || !data.id) {
        throw new Error('Invalid response from server');
      }

      setShortUrl(constructedShortUrl);
      
      // Add to history
      const newItem: HistoryItem = {
        id: data.id,
        originalUrl: validUrl,
        shortUrl: constructedShortUrl,
        timestamp: Date.now(),
        expiresAt: expiresAt || null
      };
      saveHistory([newItem, ...history.filter(h => h.id !== data.id)]);
      
      toast.success('Link shortened successfully!');
      
      // Refresh user data to update usage stats
      checkAuth().catch(console.error);
      
      // Clear form fields
      setUrl('');
      setSelectedDomainId('');
      setExpiresAt('');
    } catch (error) {
      setHasError(true);
      toast.error('Failed to shorten link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.status === 'inactive') {
      toast.error('Your account is inactive. Please contact admin support.');
      return;
    }

    if (user && !user.emailVerified) {
      toast.error('Please verify your email address to shorten links.');
      return;
    }

    setBulkLoading(true);
    setBulkUrls([]);
    setBulkProgress(0);
    setBulkCurrentCount(0);

    try {
      let urlsToShorten: string[] = [];

      if (bulkType === 'repeat') {
        // Validate URL
        let validUrl = url.trim();
        if (!/^https?:\/\//i.test(validUrl)) {
          validUrl = `http://${validUrl}`;
        }

        try {
          new URL(validUrl);
        } catch {
          toast.error('Please enter a valid URL (e.g., https://example.com)');
          setBulkLoading(false);
          return;
        }
        urlsToShorten = Array(Math.min(Math.max(bulkCount, 1), 1000)).fill(validUrl);
      } else {
        // Parse list
        const rawUrls = bulkUrlList
          .split('\n')
          .map(u => u.trim())
          .filter(u => u.length > 0);
        
        if (rawUrls.length === 0) {
          toast.error('Please enter at least one URL');
          setBulkLoading(false);
          return;
        }

        const invalidUrls: string[] = [];
        urlsToShorten = rawUrls.map(u => {
          let processed = u;
          if (!/^https?:\/\//i.test(processed)) {
            processed = `http://${processed}`;
          }
          try {
            new URL(processed);
            return processed;
          } catch {
            invalidUrls.push(u);
            return '';
          }
        });

        if (invalidUrls.length > 0) {
          const firstFew = invalidUrls.slice(0, 3).join(', ');
          const more = invalidUrls.length > 3 ? ` and ${invalidUrls.length - 3} more` : '';
          toast.error(`Invalid URL format: ${firstFew}${more}. Please check your list.`, {
            duration: 5000
          });
          setBulkLoading(false);
          return;
        }
      }

      // Check plan limits
      const plan = user?.plan || 'free';
      const limits = {
        free: { links: 50 },
        pro: { links: Infinity },
        enterprise: { links: Infinity }
      }[plan as 'free' | 'pro' | 'enterprise'] || { links: 50 };

      if (limits.links !== Infinity && (user?.usage?.linksThisMonth || 0) + urlsToShorten.length > limits.links) {
        toast.error(`You have reached your monthly limit of ${limits.links} links. Please upgrade your plan.`);
        setBulkLoading(false);
        return;
      }

      const batchSize = 50; // Increased batch size for bulk API
      const allUrls: string[] = [];
      
      // Execute in batches
      for (let i = 0; i < urlsToShorten.length; i += batchSize) {
        const batch = urlsToShorten.slice(i, i + batchSize);
        
        const result = await apiClient<{ ids: string[], domainName: string | null }>('/api/bulk-shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            urls: batch,
            domainId: selectedDomainId || undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
          }),
          showToast: false
        });

        // Construct short URLs
        const domain = result.domainName || window.location.host;
        const protocol = window.location.protocol;
        const shortUrls = result.ids.map(id => `${protocol}//${domain}/${id}`);
        
        allUrls.push(...shortUrls);
        setBulkUrls(prev => [...prev, ...shortUrls]);
        
        const currentCount = Math.min(i + batchSize, urlsToShorten.length);
        setBulkCurrentCount(currentCount);
        setBulkProgress((currentCount / urlsToShorten.length) * 100);
      }

      // Add bulk entry to history
      const newItem: HistoryItem = {
        id: `bulk-${nanoid(6)}`,
        originalUrl: bulkType === 'repeat' ? url : `${urlsToShorten.length} URLs`,
        shortUrl: `${allUrls.length} links generated`,
        timestamp: Date.now(),
        expiresAt: expiresAt || null,
        isBulk: true,
        bulkUrls: allUrls
      };
      saveHistory([newItem, ...history.filter(h => h.id !== newItem.id)]);

      toast.success(`Successfully generated ${allUrls.length} links!`);
      
      // Refresh user data to update usage stats
      checkAuth().catch(console.error);
      
      // Clear form fields
      setUrl('');
      setBulkUrlList('');
      setSelectedDomainId('');
      setExpiresAt('');
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast.error('Failed to complete bulk generation');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyBulkUrls = async () => {
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

  const openShareModal = (url: string) => {
    setShareUrl(url);
    setIsShareModalOpen(true);
  };

  const openQrModal = (url: string) => {
    setQrUrl(url);
    setIsQrModalOpen(true);
  };

  const fetchAnalytics = async (startDate?: string, endDate?: string, range?: string) => {
    setIsAnalyticsLoading(true);
    try {
      let url = '/api/analytics';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (range) params.append('range', range);
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await apiClient(url, { showToast: false });
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleRequestUpgrade = async () => {
    if (!selectedPlan) return false;
    try {
      await apiClient('/api/profile/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan.id }),
        successMessage: 'Upgrade request sent! Admin will activate your plan shortly.'
      });
      // Refresh user data
      checkAuth().catch(console.error);
      return true;
    } catch (error) {
      return false;
    }
  };

  const ShareModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsShareModalOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-md p-6 rounded-3xl shadow-2xl",
          theme === 'dark' ? "bg-[#0a0a0a] border border-white/10" : "bg-white"
        )}
      >
        <button 
          onClick={() => setIsShareModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        
        <h3 className={cn("text-xl font-bold mb-6", theme === 'dark' ? "text-white" : "text-gray-900")}>Share Link</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            <div className="p-2 bg-white dark:bg-black/20 rounded-lg">
              <QrCode size={24} className={theme === 'dark' ? "text-white" : "text-gray-900"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Short Link</p>
              <p className={cn("text-sm font-mono truncate", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>
                {shareUrl}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl || '')}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors font-bold text-sm"
            >
              <Twitter size={18} />
              Twitter
            </button>
            <button
              onClick={() => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl || '')}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors font-bold text-sm"
            >
              <div className="font-serif font-bold text-lg leading-none">in</div>
              LinkedIn
            </button>
          </div>
          
          <div className="pt-2">
            <button
              onClick={async () => {
                if (shareUrl) {
                  const success = await copyToClipboard(shareUrl, 'Copied to clipboard!');
                  if (success) {
                    setIsShareModalOpen(false);
                  }
                }
              }}
              className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
            >
              <Copy size={18} />
              Copy Link
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );



  if (isCheckingAuth) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-500",
        theme === 'dark' ? "bg-[#050505]" : "bg-[#fcfcfc]"
      )}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20 animate-pulse">
            <Link2 size={24} />
          </div>
          <Loader2 className="animate-spin text-brand" size={24} />
        </motion.div>
      </div>
    );
  }

  if (isUpdatePasswordPage) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-6 transition-colors duration-500",
        theme === 'dark' ? "bg-[#050505] text-gray-100" : "bg-[#fcfcfc] text-gray-900"
      )}>
        <Toaster position="bottom-center" />
        <div className={cn(
          "w-full max-w-md p-8 rounded-[32px] border shadow-2xl relative overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-500/30">
              <Lock size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Update Password</h3>
            <p className="text-gray-500 text-sm">
              Enter your new password below.
            </p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            
            if (!newPassword) {
              toast.error('Please enter a new password');
              return;
            }

            if (newPassword !== confirmPassword) {
              toast.error('Passwords do not match');
              return;
            }
            
            setIsLoggingIn(true);
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const token = urlParams.get('token');
              const oobCode = urlParams.get('oobCode');
              
              if (token) {
                // Local reset
                await apiClient('/api/auth/update-password', {
                  method: 'POST',
                  body: JSON.stringify({ token, password: newPassword }),
                  showToast: false
                });
                toast.success('Password updated successfully! Please log in.');
                setTimeout(() => {
                  window.history.replaceState(null, '', '/login');
                  window.location.reload();
                }, 1500);
              } else if (oobCode) {
                // Firebase reset
                await confirmPasswordReset(auth, oobCode, newPassword);
                toast.success('Password updated successfully!');
                setTimeout(() => {
                  window.history.replaceState(null, '', '/login');
                  window.location.reload();
                }, 1500);
              } else {
                // Try updating current user if logged in
                if (auth.currentUser) {
                  await updatePassword(auth.currentUser, newPassword);
                  toast.success('Password updated successfully!');
                  setTimeout(() => {
                    window.history.replaceState(null, '', '/');
                    window.location.reload();
                  }, 1500);
                } else {
                  throw new Error('Invalid reset link or session expired');
                }
              }
            } catch (error: any) {
              toast.error(error.message || 'Failed to update password');
            } finally {
              setIsLoggingIn(false);
            }
          }} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>

              <div className="relative">
                <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>

              <PasswordStrengthIndicator password={newPassword} theme={theme} />
            </div>
            
            <button
              type="submit"
              disabled={isLoggingIn || !newPassword || newPassword !== confirmPassword}
              className="w-full py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={18} /> : null}
              <span>Update Password</span>
            </button>
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  window.history.replaceState(null, '', '/login');
                  window.location.reload();
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LandingPage 
        theme={theme} 
        setTheme={setTheme} 
        onLogin={handleLogin} 
        onSignup={handleSignup}
        onResetPassword={handleResetPassword}
        onResendVerification={handleResendVerification}
        isLoggingIn={isLoggingIn} 
      />
    );
  }

  if (user.status === 'inactive' || user.status === 'pending' || (user.expiresAt && new Date(user.expiresAt) < new Date())) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-6 transition-colors duration-500",
        theme === 'dark' ? "bg-[#050505] text-gray-100" : "bg-[#fcfcfc] text-gray-900"
      )}>
        <div className="text-center max-w-md">
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8",
            user.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
          )}>
            {user.status === 'pending' ? <Clock size={40} /> : <Lock size={40} />}
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">
            {user.status === 'pending' ? 'Approval Pending' : 'Account Suspended'}
          </h1>
          <p className="text-gray-500 mb-8 text-lg">
            {user.status === 'pending' 
              ? 'Your account is currently waiting for administrator approval. You will receive an email once your account is activated.' 
              : user.status === 'inactive'
                ? 'Your account has been deactivated by an administrator.' 
                : 'Your account subscription has expired.'}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 mt-8">
            <button 
              onClick={async () => {
                await handleLogout();
                window.location.reload();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all"
            >
              <Home size={20} />
              <span>Return to Home</span>
            </button>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign out instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isExpiredPage || isNotFoundPage) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-6 transition-colors duration-500",
        theme === 'dark' ? "bg-[#050505] text-gray-100" : "bg-[#fcfcfc] text-gray-900"
      )}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center text-brand mx-auto mb-8">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">
            {isExpiredPage ? 'Link Expired' : 'Link Not Found'}
          </h1>
          <p className="text-gray-500 mb-8 text-lg">
            {isExpiredPage 
              ? 'This link has reached its expiration date and is no longer active.' 
              : 'The link you are looking for does not exist or has been removed.'}
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
          >
            <Link2 size={20} />
            <span>Create New Link</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingTour theme={theme} />
      <DashboardLayout
        view={view}
        setView={setView}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogout={handleLogout}
        onFetchAnalytics={fetchAnalytics}
      >
      <Toaster position="bottom-center" />








      



        {user && !user.emailVerified && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                <p className="text-sm font-bold">Please verify your email address.</p>
                <p className="text-xs opacity-80">Check your inbox for a verification link. You may need to refresh the page after verifying.</p>
              </div>
            </div>
            <button 
              onClick={() => handleResendVerification(user.email || '')}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors shrink-0"
            >
              Resend Email
            </button>
          </motion.div>
        )}

        {user && user.status === 'inactive' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Lock size={20} />
              <div>
                <p className="text-sm font-bold">Your account is currently inactive.</p>
                <p className="text-xs opacity-80">Please contact admin support to reactivate your account and resume shortening links.</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider">
              Contact Support
            </div>
          </motion.div>
        )}

        {user && user.expiresAt && (() => {
          const expiryDate = new Date(user.expiresAt);
          const now = new Date();
          const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            return (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} />
                  <div>
                    <p className="text-sm font-bold">Your plan has expired!</p>
                    <p className="text-xs opacity-80">Your account has been downgraded to the free plan. Renew now to restore your benefits.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpgrade('pro')}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors shrink-0"
                >
                  Renew Plan
                </button>
              </motion.div>
            );
          }
          
          return null;
        })()}

        {view === 'home' && user && (
          <div className="mb-6 space-y-4">
            {user.usage && (() => {
              const plan = user.plan || 'free';
              const limits = {
                free: { links: 50 },
                pro: { links: Infinity },
                enterprise: { links: Infinity }
              }[plan as 'free' | 'pro' | 'enterprise'] || { links: 50 };
              
              const remaining = limits.links === Infinity ? Infinity : limits.links - user.usage.linksThisMonth;
              
              if (remaining <= 5 && remaining > 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle size={20} />
                      <p className="text-sm font-bold">You have only {remaining} links remaining this month on your {plan} plan.</p>
                    </div>
                    <button 
                      onClick={() => handleUpgrade('pro')}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shrink-0"
                    >
                      Upgrade Now
                    </button>
                  </motion.div>
                );
              }
              
              if (remaining <= 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle size={20} />
                      <p className="text-sm font-bold">Monthly link limit reached! Upgrade to continue shortening links.</p>
                    </div>
                    <button 
                      onClick={() => handleUpgrade('pro')}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors shrink-0"
                    >
                      Upgrade Plan
                    </button>
                  </motion.div>
                );
              }
              
              return null;
            })()}
          </div>
        )}

        {view === 'home' ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "p-2 rounded-3xl border shadow-xl backdrop-blur-sm transition-all duration-300",
                theme === 'dark' ? "bg-white/5 border-white/10 shadow-black/20" : "bg-white border-gray-100 shadow-gray-200/50"
              )}
            >
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 p-2 mb-2">
                <button
                  onClick={() => setIsBulkMode(false)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    !isBulkMode 
                      ? "bg-brand text-white shadow-lg shadow-brand/20" 
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                  )}
                >
                  <Link2 size={16} />
                  Single Link
                </button>
                <button
                  onClick={() => setIsBulkMode(true)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    isBulkMode 
                      ? "bg-brand text-white shadow-lg shadow-brand/20" 
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                  )}
                >
                  <History size={16} />
                  Bulk Create
                </button>
              </div>

              <form onSubmit={isBulkMode ? handleBulkSubmit : handleSubmit} className="p-4">
                {isBulkMode && (
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="bulkType" 
                        value="repeat" 
                        checked={bulkType === 'repeat'} 
                        onChange={() => setBulkType('repeat')}
                        className="text-brand focus:ring-brand"
                      />
                      <span className={theme === 'dark' ? "text-gray-300" : "text-gray-700"}>Repeat Single URL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="bulkType" 
                        value="list" 
                        checked={bulkType === 'list'} 
                        onChange={() => setBulkType('list')}
                        className="text-brand focus:ring-brand"
                      />
                      <span className={theme === 'dark' ? "text-gray-300" : "text-gray-700"}>List of URLs</span>
                    </label>
                  </div>
                )}

                <div className="flex flex-col gap-4">
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
                      <option value="">Default Domain</option>
                      {domains.filter(d => d.status === 'verified').map(domain => (
                        <option key={domain.id} value={domain.id}>{domain.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none">
                      <ChevronDown className="text-gray-500" size={14} />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <div className={cn("absolute left-4 flex items-center pointer-events-none", bulkType === 'list' && isBulkMode ? "top-4" : "inset-y-0")}>
                      <Link2 className={cn("transition-colors", hasError ? "text-red-400" : "text-gray-400 group-focus-within:text-brand")} size={20} />
                    </div>
                    
                    {isBulkMode && bulkType === 'list' ? (
                      <textarea
                        placeholder="Paste your list of URLs here (one per line, comma or space separated)..."
                        value={bulkUrlList}
                        onChange={(e) => {
                          setBulkUrlList(e.target.value);
                          setHasError(false);
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData.getData('text');
                          const urls = pastedText.split(/[\n, \t]+/).filter(u => u.trim().length > 0).map(u => u.trim());
                          if (urls.length > 0) {
                            setBulkUrlList(prev => prev + (prev ? '\n' : '') + urls.join('\n'));
                            e.preventDefault();
                          }
                        }}
                        className={cn(
                          "w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-medium text-lg min-h-[120px] resize-y",
                          theme === 'dark' 
                            ? "bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-brand/50 focus:bg-black/40" 
                            : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-brand/50 focus:bg-white",
                          hasError && "border-red-400 focus:border-red-400 bg-red-50/10"
                        )}
                        required
                      />
                    ) : (
                      <input
                        type="url"
                        placeholder={isBulkMode ? "Enter base URL to generate bulk links..." : "Paste your long URL here..."}
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          setHasError(false);
                        }}
                        className={cn(
                          "w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all font-medium text-lg",
                          theme === 'dark' 
                            ? "bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-brand/50 focus:bg-black/40" 
                            : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-brand/50 focus:bg-white",
                          hasError && "border-red-400 focus:border-red-400 bg-red-50/10"
                        )}
                        required
                      />
                    )}

                    {isBulkMode && bulkType === 'repeat' && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Count:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="1000" 
                          value={bulkCount}
                          onChange={(e) => setBulkCount(parseInt(e.target.value) || 100)}
                          className={cn(
                            "w-16 py-1 px-2 rounded-lg text-sm font-bold text-center outline-none border focus:border-brand/50 transition-all",
                            theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                          )}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={
                      loading || 
                      bulkLoading || 
                      (isBulkMode && bulkType === 'list' ? !bulkUrlList : !url) ||
                      (user?.usage && (user.plan || 'free') === 'free' && user.usage.linksThisMonth >= 50)
                    }
                    className={cn(
                      "px-8 py-4 bg-brand text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 min-w-[160px] group disabled:opacity-70 disabled:cursor-not-allowed",
                      !loading && !bulkLoading && (user?.usage && (user.plan || 'free') === 'free' && user.usage.linksThisMonth < 50) && "hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]",
                      isBulkMode && bulkType === 'list' ? "h-auto self-start" : ""
                    )}
                  >
                    {loading || bulkLoading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <span>
                          {user?.usage && (user.plan || 'free') === 'free' && user.usage.linksThisMonth >= 50 
                            ? 'Limit Reached' 
                            : (isBulkMode ? 'Generate' : 'Shorten')}
                        </span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced Options */}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setView('domains')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                        theme === 'dark' 
                          ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10" 
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                        selectedDomainId && "border-brand text-brand bg-brand/5"
                      )}
                    >
                      <Globe size={14} />
                      <span>{selectedDomainId ? domains.find(d => d.id === selectedDomainId)?.name : 'Custom Domain'}</span>
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Calendar className="text-gray-400" size={14} />
                    </div>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className={cn(
                        "pl-9 pr-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none transition-all w-48",
                        theme === 'dark' 
                          ? "bg-white/5 border-white/10 text-gray-400 focus:text-white focus:border-brand/50" 
                          : "bg-gray-50 border-gray-200 text-gray-500 focus:text-gray-900 focus:border-brand/50"
                      )}
                    />
                  </div>
                </div>
              </form>
            </motion.div>

            {/* Result Section */}
            <AnimatePresence>
              {shortUrl && !isBulkMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={cn(
                    "mt-8 p-6 rounded-2xl border shadow-lg backdrop-blur-sm",
                    theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
                  )}
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                        <Check size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Success!</p>
                        <a href={shortUrl} target="_blank" rel="noreferrer" className={cn("text-xl font-bold truncate block hover:underline", theme === 'dark' ? "text-white" : "text-gray-900")}>
                          {shortUrl?.replace ? shortUrl.replace(/^https?:\/\//, '') : shortUrl}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleCopyToClipboard(shortUrl)}
                        className={cn(
                          "flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                          copied 
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : theme === 'dark' 
                              ? "bg-white/10 text-white hover:bg-white/20" 
                              : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                        )}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => openShareModal(shortUrl)}
                        className={cn(
                          "px-4 py-3 rounded-xl transition-all",
                          theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                        )}
                        title="Share"
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        onClick={() => openQrModal(shortUrl)}
                        className={cn(
                          "px-4 py-3 rounded-xl transition-all",
                          theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                        )}
                        title="QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Results */}
            <AnimatePresence>
              {(bulkLoading || bulkUrls.length > 0) && isBulkMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={cn(
                    "mt-8 p-6 rounded-2xl border shadow-lg backdrop-blur-sm",
                    theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        bulkLoading ? "bg-brand/10 text-brand" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {bulkLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-lg", theme === 'dark' ? "text-white" : "text-gray-900")}>
                          {bulkLoading ? 'Generating Links...' : 'Bulk Generation Complete'}
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                          {bulkLoading ? `${bulkCurrentCount} of ${bulkCount}` : `${bulkUrls.length} links created`}
                        </p>
                      </div>
                    </div>
                    {!bulkLoading && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBulkUrls([])}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
                            theme === 'dark' ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"
                          )}
                        >
                          <Trash2 size={14} />
                          Clear
                        </button>
                        <button
                          onClick={handleCopyBulkUrls}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
                            bulkCopied 
                              ? "bg-emerald-500 text-white" 
                              : theme === 'dark' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                          )}
                        >
                          {bulkCopied ? <Check size={14} /> : <Copy size={14} />}
                          Copy All
                        </button>
                        <button
                          onClick={downloadBulkUrls}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
                            theme === 'dark' ? "bg-brand/10 text-brand hover:bg-brand/20" : "bg-brand/10 text-brand hover:bg-brand/20"
                          )}
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  {bulkLoading && (
                    <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-6">
                      <motion.div 
                        className="h-full bg-brand"
                        initial={{ width: 0 }}
                        animate={{ width: `${bulkProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  <div className="mt-4 border rounded-xl overflow-hidden dark:border-white/10">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-sm">
                        <thead className={cn(
                          "sticky top-0 z-10 backdrop-blur-md",
                          theme === 'dark' ? "bg-black/40 text-gray-400" : "bg-gray-50/90 text-gray-500"
                        )}>
                          <tr>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">#</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Short URL</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-white/5">
                          {bulkUrls.map((bUrl, i) => (
                            <tr 
                              key={`bulk-url-${i}`}
                              className={cn(
                                "transition-colors group",
                                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                              )}
                            >
                              <td className="px-4 py-3 text-gray-500 font-mono text-xs">{i + 1}</td>
                              <td className={cn("px-4 py-3 font-mono", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>
                                {bUrl?.replace ? bUrl.replace(/^https?:\/\//, '') : bUrl}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={async () => {
                                      await copyToClipboard(bUrl, 'Copied!');
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-lg transition-colors",
                                      theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                                    )}
                                    title="Copy"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <a 
                                    href={bUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className={cn(
                                      "p-1.5 rounded-lg transition-colors inline-flex",
                                      theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                                    )}
                                    title="Open"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analytics Navigation */}
            <div className="mt-8 mb-4 flex justify-center">
              <button
                onClick={() => {
                  setView('analytics');
                  fetchAnalytics();
                }}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg group",
                  theme === 'dark' 
                    ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white shadow-black/20" 
                    : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 shadow-gray-200/50"
                )}
              >
                <BarChart2 size={20} className="text-brand" />
                <span>View Analytics</span>
                <ArrowRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* History List */}
            <HistoryList 
              history={history}
              theme={theme}
              onDelete={deleteFromHistory}
              onBulkDelete={bulkDeleteFromHistory}
              onClear={() => setIsClearHistoryModalOpen(true)}
              openShareModal={openShareModal}
              openQrModal={openQrModal}
              onItemClick={(item) => {
                setSelectedLink(item);
                setIsLinkDetailsModalOpen(true);
              }}
            />

            {/* Link Details Modal */}
            <LinkDetailsModal 
              item={selectedLink}
              isOpen={isLinkDetailsModalOpen}
              onClose={() => setIsLinkDetailsModalOpen(false)}
              theme={theme}
              onDelete={deleteFromHistory}
              onUpdate={handleUpdateLink}
            />

            {/* Clear History Modal */}
            <ClearHistoryModal 
              isOpen={isClearHistoryModalOpen}
              onClose={() => setIsClearHistoryModalOpen(false)}
              onConfirm={async () => {
                clearHistory();
                setIsClearHistoryModalOpen(false);
              }}
              theme={theme}
            />
          </>
        ) : view === 'analytics' ? (
          <AnalyticsView 
            isAnalyticsLoading={isAnalyticsLoading}
            analyticsData={analyticsData}
            theme={theme}
            setView={setView}
            onRefresh={fetchAnalytics}
          />
        ) : view === 'domains' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold mb-2">Custom Domains</h1>
                <p className="text-gray-500">Manage your branded domains for shorter, more professional links.</p>
              </div>
            </div>
            <DomainManager 
              isOpen={true}
              onClose={() => setView('home')}
              domains={domains} 
              onAdd={handleAddDomain} 
              onDelete={handleDeleteDomain} 
              onVerify={handleVerifyDomain}
              theme={theme}
              standalone={true}
            />
          </div>
        ) : view === 'api-keys' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold mb-2">API Keys</h1>
                <p className="text-gray-500">Use our API to integrate link shortening into your own applications.</p>
              </div>
            </div>
            <ApiKeyManager 
              apiKeys={apiKeys} 
              onGenerate={handleGenerateApiKey} 
              onDelete={handleDeleteApiKey}
              theme={theme}
            />
          </div>
        ) : view === 'profile' ? (
          <ProfileView 
            user={user}
            theme={theme}
            setTheme={setTheme}
            domains={domains}
            defaultDomainId={selectedDomainId}
            setDefaultDomainId={setSelectedDomainId}
            onLogout={handleLogout}
            onUpgrade={() => handleUpgrade('pro')}
            onUpdate={(updatedUser) => setUser(prev => prev ? { ...prev, ...updatedUser } : null)}
            apiKeys={apiKeys}
            onGenerateApiKey={handleGenerateApiKey}
            onDeleteApiKey={handleDeleteApiKey}
            onDismissMessage={handleDismissMessage}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          />
        ) : view === 'admin' ? (
          <AdminView theme={theme} user={user} />
        ) : view === 'support' ? (
          <SupportView theme={theme} />
        ) : null}

        {isPaymentModalOpen && selectedPlan && (
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onConfirm={handleRequestUpgrade}
            plan={selectedPlan}
            theme={theme}
          />
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal 
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            theme={theme}
          />
        )}

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-auto pt-24 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] flex flex-wrap justify-center items-center gap-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-brand" />
            <span>SQLite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-brand" />
            <span>Express</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-brand" />
            <span>Vite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-brand" />
            <span>TypeScript</span>
          </div>
        </motion.div>


      {/* Decorative grid */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <AnimatePresence>
        {isShareModalOpen && <ShareModal />}
        <QrCodeModal 
          isOpen={isQrModalOpen} 
          onClose={() => setIsQrModalOpen(false)} 
          url={qrUrl} 
          theme={theme} 
        />
        <ClearHistoryModal 
          isOpen={isClearHistoryModalOpen} 
          onClose={() => setIsClearHistoryModalOpen(false)} 
          onConfirm={clearHistory} 
          theme={theme} 
        />
        {user?.message && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismissMessage}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden",
                theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
              )}
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="text-brand" size={32} />
                </div>
                <h3 className={cn(
                  "text-2xl font-display font-bold mb-4",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Message from Admin
                </h3>
                <p className={cn(
                  "text-base leading-relaxed mb-8",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  {user.message}
                </p>
                <button
                  onClick={handleDismissMessage}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
    </>
  );
}
