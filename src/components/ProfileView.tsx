import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Sparkles, Loader2, Trash2, Palette, Key, LogOut, Link2, Globe, CreditCard, CheckCircle, Plus, Bell, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, ApiKey } from '../types';
import { ApiKeyManager } from './ApiKeyManager';
import { DeleteAccountModal } from './DeleteAccountModal';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { updateEmail, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiClient } from '../lib/api';
import { Copy, Calendar } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProfileViewProps {
  user: User | null;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  domains: { id: string; name: string }[];
  defaultDomainId: string;
  setDefaultDomainId: (id: string) => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onUpdate: (user: any) => void;
  apiKeys: ApiKey[];
  onGenerateApiKey: (name: string) => Promise<any>;
  onDeleteApiKey: (id: string) => Promise<void>;
  onOpenFeedback: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  theme, 
  setTheme,
  domains,
  defaultDomainId,
  setDefaultDomainId,
  onLogout,
  onUpgrade,
  onUpdate,
  apiKeys,
  onGenerateApiKey,
  onDeleteApiKey,
  onOpenFeedback
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [notifications, setNotifications] = useState({
    notify_link_created: true,
    notify_weekly_report: true,
    notify_plan_expiry: true
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  React.useEffect(() => {
    fetchPaymentMethods();
    fetchNotificationSettings();
    
    // Check for payment setup success
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_setup') === 'success') {
      toast.success('Payment method added successfully');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const data = await apiClient('/api/payments/methods');
      if (Array.isArray(data.methods)) {
        const uniqueMethods = Array.from(new Map(data.methods.map((m: any) => [m.id, m])).values());
        setPaymentMethods(uniqueMethods);
      } else {
        setPaymentMethods([]);
      }
      setDefaultMethodId(data.defaultMethodId);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await apiClient(`/api/payments/methods/${methodId}/default`, { method: 'POST' });
      setDefaultMethodId(methodId);
      toast.success('Default payment method updated');
    } catch (error) {
      toast.error('Failed to update default payment method');
    }
  };

  const handleRemoveMethod = async (methodId: string) => {
    try {
      await apiClient(`/api/payments/methods/${methodId}`, { method: 'DELETE' });
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== methodId));
      if (defaultMethodId === methodId) setDefaultMethodId(null);
      toast.success('Payment method removed');
    } catch (error) {
      toast.error('Failed to remove payment method');
    }
  };

  const handleAddMethod = async () => {
    try {
      const { url } = await apiClient('/api/payments/create-setup-session', { method: 'POST' });
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to initiate payment setup');
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const data = await apiClient('/api/profile/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    }
  };

  const handleUpdateNotifications = async (key: keyof typeof notifications, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    setIsUpdatingNotifications(true);
    try {
      await apiClient('/api/profile/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
      // Revert on error
      setNotifications(notifications);
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const plan = user?.plan || 'free';
  const limits = {
    free: { domains: 1, links: 50 },
    pro: { domains: 5, links: Infinity },
    enterprise: { domains: Infinity, links: Infinity }
  }[plan as 'free' | 'pro' | 'enterprise'] || { domains: 1, links: 50 };

  const linkUsagePercent = limits.links === Infinity ? 0 : Math.min(100, ((user?.usage?.linksThisMonth || 0) / limits.links) * 100);
  const domainUsagePercent = limits.domains === Infinity ? 0 : Math.min(100, ((user?.usage?.domains || 0) / limits.domains) * 100);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Update email in Firebase if changed
      if (email !== user?.email && auth.currentUser) {
        try {
          await updateEmail(auth.currentUser, email);
          toast.success('Please check your new email for a confirmation link');
        } catch (error: any) {
          if (error.code === 'auth/requires-recent-login') {
            toast.error('This operation requires recent authentication. Please log out and log in again.');
            return;
          }
          throw error;
        }
      }

      const updatedUser = await apiClient('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatar_url: avatarUrl }),
      });
      onUpdate(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setIsChangingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password changed successfully');
        alert('Your password has been updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('This operation requires recent authentication. Please log out and log in again.');
      } else {
        toast.error(error.message || 'Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiClient('/api/profile/delete', { method: 'POST' });
      toast.success('Account deleted successfully');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account. Please try again.');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-8 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand/10 border-2 border-brand/20 shrink-0 shadow-lg shadow-brand/10">
            <img 
              src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email || 'User')}&backgroundColor=6366f1,4f46e5&textColor=ffffff`} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-display font-bold">{name || 'Account Settings'}</h2>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                user?.status === 'inactive' 
                  ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              )}>
                {user?.status || 'active'}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-gray-500 text-sm">{email}</p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (user?.id) {
                      navigator.clipboard.writeText(user.id);
                      toast.success('User ID copied!');
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-brand transition-colors flex items-center gap-1 font-mono uppercase tracking-widest"
                >
                  <Copy size={10} />
                  ID: {user?.id?.substring(0, 8)}...
                </button>
                {user?.createdAt && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono uppercase tracking-widest">
                    <Calendar size={10} />
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenFeedback}
            className={cn(
              "px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-bold",
              theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <MessageSquare size={16} />
            Feedback
          </button>
          <button 
            onClick={onLogout}
            className={cn(
              "px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-bold",
              theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-brand" />
            Subscription Plan
          </h3>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-brand/5 border border-brand/10 mb-6">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Current Plan</p>
              <p className="text-xl font-bold text-brand capitalize">{user?.plan || 'Free'}</p>
              {user?.pendingPlan && (
                <div className="mt-2 flex items-center gap-2 text-amber-500">
                  <Loader2 className="animate-spin" size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pending Upgrade: {user.pendingPlan}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={onUpgrade}
                disabled={!!user?.pendingPlan}
                className="px-6 py-2 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {user?.pendingPlan ? 'Waiting for Admin' : 'Upgrade Plan'}
              </button>
              {!user?.pendingPlan && (
                <a 
                  href="https://t.me/roeunmarin" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] text-gray-500 hover:text-brand transition-colors flex items-center gap-1"
                >
                  Contact Admin for Activation
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Link Usage */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-gray-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Links Created</span>
                </div>
                <span className={cn(
                  "text-xs font-bold",
                  linkUsagePercent > 90 ? "text-red-500" : "text-brand"
                )}>
                  {user?.usage?.linksThisMonth || 0} / {limits.links === Infinity ? '∞' : limits.links}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${linkUsagePercent}%` }}
                  className={cn(
                    "h-full transition-all duration-500",
                    linkUsagePercent > 90 ? "bg-red-500" : "bg-brand"
                  )}
                />
              </div>
              {linkUsagePercent >= 100 && (
                <p className="text-[10px] text-red-500 font-bold uppercase mt-2 animate-pulse">
                  Monthly link limit reached. Upgrade to continue.
                </p>
              )}
            </div>

            {/* Domain Usage */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-gray-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Custom Domains</span>
                </div>
                <span className={cn(
                  "text-xs font-bold",
                  domainUsagePercent >= 100 ? "text-red-500" : "text-brand"
                )}>
                  {user?.usage?.domains || 0} / {limits.domains === Infinity ? '∞' : limits.domains}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${domainUsagePercent}%` }}
                  className={cn(
                    "h-full transition-all duration-500",
                    domainUsagePercent >= 100 ? "bg-red-500" : "bg-brand"
                  )}
                />
              </div>
              {domainUsagePercent >= 100 && (
                <p className="text-[10px] text-red-500 font-bold uppercase mt-2 animate-pulse">
                  Domain limit reached. Upgrade for more domains.
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Plan Limits</h4>
            <div className="flex justify-between items-center text-sm">
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Custom Domains</span>
              <span className="font-mono font-bold">
                {user?.plan === 'enterprise' ? 'Unlimited' : user?.plan === 'pro' ? '5' : '1'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Link Generation</span>
              <span className="font-mono font-bold">
                {user?.plan === 'enterprise' ? 'Unlimited' : user?.plan === 'pro' ? 'Unlimited' : '50 / month'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Analytics</span>
              <span className="font-mono font-bold">
                {user?.plan === 'enterprise' ? 'Advanced' : user?.plan === 'pro' ? 'Advanced' : 'Basic'}
              </span>
            </div>
            {user?.expiresAt && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 dark:border-white/5 mt-2">
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Expires At</span>
                <span className={cn(
                  "font-mono font-bold",
                  new Date(user.expiresAt) < new Date() ? "text-red-500" : "text-brand"
                )}>
                  {new Date(user.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            {user?.plan === 'pro' 
              ? "You're currently on the Pro plan. Enjoy unlimited links and custom domains!" 
              : user?.plan === 'enterprise'
              ? "You're on the Enterprise plan. Enjoy unlimited everything!"
              : "Upgrade to Pro for unlimited links, custom domains, and advanced analytics."}
          </p>
        </div>

        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Settings size={20} className="text-brand" />
            Profile Information
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Display Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Avatar URL</label>
              <input 
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
                placeholder="https://example.com/avatar.png"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Email Address</label>
              <input 
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
                placeholder="email@example.com"
              />
            </div>
            <button 
              type="submit"
              disabled={isUpdating}
              className="w-full bg-brand text-white py-3 rounded-xl font-bold hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Palette size={20} className="text-brand" />
            Preferences
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 block">Theme</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2",
                    theme === 'light' 
                      ? "bg-brand text-white border-brand shadow-lg shadow-brand/20" 
                      : (theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100")
                  )}
                >
                  Light Mode
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2",
                    theme === 'dark' 
                      ? "bg-brand text-white border-brand shadow-lg shadow-brand/20" 
                      : (theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100")
                  )}
                >
                  Dark Mode
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 block">Default Domain</label>
              <select 
                value={defaultDomainId}
                onChange={(e) => setDefaultDomainId(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all cursor-pointer appearance-none",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
              >
                <option value="" className={theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"}>
                  Default ({window.location.hostname.includes('localhost') || window.location.hostname.includes('.run.app') ? window.location.hostname : 'cutly.us'})
                </option>
                {domains.map((d, index) => (
                  <option key={`${d.id}-${index}`} value={d.id} className={theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"}>{d.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-2">This domain will be selected by default when you shorten a link.</p>
            </div>
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard size={20} className="text-brand" />
              Payment Methods
            </h3>
            <button 
              onClick={handleAddMethod}
              className="p-2 rounded-xl bg-brand/10 text-brand hover:bg-brand/20 transition-all"
              title="Add Payment Method"
            >
              <Plus size={20} />
            </button>
          </div>

          {isLoadingMethods ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-brand" size={24} />
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div 
                  key={pm.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase",
                      theme === 'dark' ? "bg-white/10" : "bg-white border border-gray-200"
                    )}>
                      {pm.brand}
                    </div>
                    <div>
                      <p className="text-sm font-bold">•••• •••• •••• {pm.last4}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expires {pm.expMonth}/{pm.expYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {defaultMethodId === pm.id ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-lg">
                        <CheckCircle size={10} />
                        Default
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleSetDefault(pm.id)}
                        className="text-[10px] font-bold text-gray-500 hover:text-brand uppercase tracking-wider transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveMethod(pm.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Card"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard size={40} className="text-gray-300 mx-auto mb-4 opacity-20" />
              <p className="text-sm text-gray-500">No payment methods saved.</p>
              <button 
                onClick={handleAddMethod}
                className="mt-4 text-brand font-bold text-sm hover:underline"
              >
                Add your first card
              </button>
            </div>
          )}
        </div>

        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Bell size={20} className="text-brand" />
            Notification Settings
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Link Creation</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Receive email when a new link is created</p>
              </div>
              <button
                onClick={() => handleUpdateNotifications('notify_link_created', !notifications.notify_link_created)}
                disabled={isUpdatingNotifications}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  notifications.notify_link_created ? "bg-brand" : (theme === 'dark' ? "bg-white/10" : "bg-gray-200")
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  notifications.notify_link_created ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Weekly Reports</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Get a summary of your link performance every Monday</p>
              </div>
              <button
                onClick={() => handleUpdateNotifications('notify_weekly_report', !notifications.notify_weekly_report)}
                disabled={isUpdatingNotifications}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  notifications.notify_weekly_report ? "bg-brand" : (theme === 'dark' ? "bg-white/10" : "bg-gray-200")
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  notifications.notify_weekly_report ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Plan Expiry</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Alerts when your subscription is about to expire</p>
              </div>
              <button
                onClick={() => handleUpdateNotifications('notify_plan_expiry', !notifications.notify_plan_expiry)}
                disabled={isUpdatingNotifications}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  notifications.notify_plan_expiry ? "bg-brand" : (theme === 'dark' ? "bg-white/10" : "bg-gray-200")
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  notifications.notify_plan_expiry ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-brand" />
            Security
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Current Password</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={cn(
                  "w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/50 outline-none transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                )}
                placeholder="••••••••"
              />
              <PasswordStrengthIndicator password={newPassword} theme={theme} />
            </div>
            <button 
              type="submit"
              disabled={isChangingPassword || !newPassword}
              className="w-full bg-brand text-white py-3 rounded-xl font-bold hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
            </button>
          </form>
        </div>
        <div className={cn(
          "p-8 rounded-3xl border backdrop-blur-sm transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
        )}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Key size={20} className="text-brand" />
            API Keys
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Manage API keys for programmatic access to the URL shortener.
          </p>
          <ApiKeyManager 
            theme={theme} 
            apiKeys={apiKeys}
            onGenerate={onGenerateApiKey}
            onDelete={onDeleteApiKey}
          />
        </div>
      </div>

      <div className={cn(
        "p-8 rounded-3xl border backdrop-blur-sm transition-all border-red-500/20 bg-red-500/5",
        theme === 'dark' ? "" : ""
      )}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-500">Once you delete your account, there is no going back. Please be certain.</p>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        onConfirm={handleDeleteAccount} 
        theme={theme} 
      />
    </div>
  );
};
