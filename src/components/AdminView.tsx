import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Skeleton } from './Skeleton';
import { Shield, Trash2, Search, User as UserIcon, Settings, Layout, Plus, ArrowUpDown, Edit2, Globe, Key, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LandingFeature, LandingFaq, User as UserType } from '../types';
import { DeleteUserModal } from './DeleteUserModal';
import { EditUserModal } from './EditUserModal';
import { DomainManager } from './DomainManager';
import { ApiKeyManager } from './ApiKeyManager';
import { HistoryList } from './HistoryList';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminViewProps {
  theme: 'light' | 'dark';
  user: UserType | null;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  pendingPlan: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  message: string | null;
  usage?: {
    linksThisMonth: number;
  };
}

interface Setting {
  key: string;
  value: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ theme, user }) => {
  if (!user || !['admin', 'editor', 'viewer'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to access the admin panel.</p>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'content' | 'domains' | 'apiKeys' | 'history'>(
    user?.role === 'admin' ? 'users' : user?.role === 'editor' ? 'content' : 'history'
  );
  const [users, setUsers] = useState<UserData[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [features, setFeatures] = useState<LandingFeature[]>([]);
  const [faqs, setFaqs] = useState<LandingFaq[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'email' | 'usage' | 'plan' | 'role' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'content') fetchContent();
    if (activeTab === 'domains') fetchDomains();
    if (activeTab === 'apiKeys') fetchApiKeys();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchUsers = async () => {
    setTabLoading(prev => ({ ...prev, users: true }));
    try {
      const data = await apiClient<UserData[]>('/api/admin/users');
      if (Array.isArray(data)) {
        const uniqueUsers = Array.from(new Map(data.map(u => [u.id, u])).values());
        setUsers(uniqueUsers);
      } else {
        setUsers([]);
      }
      setSelectedUsers([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setTabLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchSettings = async () => {
    setTabLoading(prev => ({ ...prev, settings: true }));
    try {
      const data = await apiClient<Setting[]>('/api/admin/settings');
      if (Array.isArray(data)) {
        const uniqueSettings = Array.from(new Map(data.map(s => [s.key, s])).values());
        setSettings(uniqueSettings);
      } else {
        setSettings([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch settings');
      setSettings([]);
    } finally {
      setTabLoading(prev => ({ ...prev, settings: false }));
    }
  };

  const fetchContent = async () => {
    setTabLoading(prev => ({ ...prev, content: true }));
    try {
      const [featuresData, faqsData] = await Promise.all([
        apiClient<LandingFeature[]>('/api/admin/features'),
        apiClient<LandingFaq[]>('/api/admin/faqs')
      ]);
      if (Array.isArray(featuresData)) {
        const uniqueFeatures = Array.from(new Map(featuresData.map(f => [f.id, f])).values());
        setFeatures(uniqueFeatures);
      } else {
        setFeatures([]);
      }
      if (Array.isArray(faqsData)) {
        const uniqueFaqs = Array.from(new Map(faqsData.map(f => [f.id, f])).values());
        setFaqs(uniqueFaqs);
      } else {
        setFaqs([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch content');
      setFeatures([]);
      setFaqs([]);
    } finally {
      setTabLoading(prev => ({ ...prev, content: false }));
    }
  };

  const fetchDomains = async () => {
    setTabLoading(prev => ({ ...prev, domains: true }));
    try {
      const data = await apiClient<any[]>('/api/admin/domains');
      setDomains(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch domains');
      setDomains([]);
    } finally {
      setTabLoading(prev => ({ ...prev, domains: false }));
    }
  };

  const fetchApiKeys = async () => {
    setTabLoading(prev => ({ ...prev, apiKeys: true }));
    try {
      const data = await apiClient<any[]>('/api/admin/keys');
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch API keys');
      setApiKeys([]);
    } finally {
      setTabLoading(prev => ({ ...prev, apiKeys: false }));
    }
  };

  const fetchHistory = async () => {
    setTabLoading(prev => ({ ...prev, history: true }));
    try {
      const data = await apiClient<any[]>('/api/admin/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch history');
      setHistory([]);
    } finally {
      setTabLoading(prev => ({ ...prev, history: false }));
    }
  };

  const handleAddDomain = async (name: string) => {
    try {
      await apiClient('/api/admin/domains', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      toast.success('Domain added');
      fetchDomains();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add domain');
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await apiClient(`/api/admin/domains/${id}`, {
        method: 'DELETE'
      });
      toast.success('Domain deleted');
      fetchDomains();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete domain');
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
      await apiClient(`/api/admin/domains/${id}/verify`, {
        method: 'POST'
      });
      toast.success('Domain verified');
      fetchDomains();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify domain');
    }
  };

  const handleGenerateApiKey = async (name: string) => {
    try {
      const newKey = await apiClient<any>('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      toast.success('API Key generated');
      fetchApiKeys();
      return newKey;
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate API key');
      throw error;
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiClient(`/api/admin/keys/${id}`, {
        method: 'DELETE'
      });
      toast.success('API Key deleted');
      fetchApiKeys();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete API key');
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await apiClient(`/api/admin/history/${id}`, {
        method: 'DELETE'
      });
      toast.success('History item deleted');
      fetchHistory();
    } catch (error) {
      toast.error('Failed to delete history item');
    }
  };

  const handleBulkDeleteHistory = async (ids: string[]) => {
    try {
      await apiClient('/api/admin/history/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      toast.success('History items deleted');
      fetchHistory();
    } catch (error) {
      toast.error('Failed to delete history items');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) return;
    try {
      await apiClient('/api/admin/history/clear', {
        method: 'POST'
      });
      toast.success('History cleared');
      fetchHistory();
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const handleUpdateFaq = async (faq: LandingFaq) => {
    try {
      await apiClient('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      setFaqs(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        if (arr.find(f => f.id === faq.id)) {
          return arr.map(f => f.id === faq.id ? faq : f);
        } else {
          return [...arr, faq];
        }
      });
      toast.success('FAQ updated');
    } catch (error) {
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await apiClient(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      });
      setFaqs(prev => Array.isArray(prev) ? prev.filter(f => f.id !== id) : []);
      toast.success('FAQ deleted');
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await apiClient('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      setSettings(prev => Array.isArray(prev) ? prev.map(s => s.key === key ? { ...s, value } : s) : []);
      toast.success('Setting updated');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const handleUpdateFeature = async (feature: LandingFeature) => {
    try {
      await apiClient('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feature),
      });
      setFeatures(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        if (arr.find(f => f.id === feature.id)) {
          return arr.map(f => f.id === feature.id ? feature : f);
        } else {
          return [...arr, feature];
        }
      });
      toast.success('Feature updated');
    } catch (error) {
      toast.error('Failed to update feature');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      await apiClient(`/api/admin/features/${id}`, {
        method: 'DELETE',
      });
      setFeatures(prev => Array.isArray(prev) ? prev.filter(f => f.id !== id) : []);
      toast.success('Feature deleted');
    } catch (error) {
      toast.error('Failed to delete feature');
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await apiClient(`/api/admin/users/${userId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('User updated successfully');
      setUsers(prev => Array.isArray(prev) ? prev.map(u => u.id === userId ? { ...u, ...data, expiresAt: data.expiresAt || null, pendingPlan: data.pendingPlan || null } : u) : []);
      setEditingUser(null);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleApprovePlan = async (user: UserData) => {
    if (!user.pendingPlan) return;
    
    // Set expiration to 30 days from now by default when approving
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtStr = expiresAt.toISOString();

    try {
      await apiClient(`/api/admin/users/${user.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: user.pendingPlan,
          pendingPlan: '',
          expiresAt: expiresAtStr
        }),
      });
      toast.success(`Plan ${user.pendingPlan} approved for ${user.email}`);
      setUsers(prev => Array.isArray(prev) ? prev.map(u => u.id === user.id ? { ...u, plan: user.pendingPlan!, pendingPlan: null, expiresAt: expiresAtStr } : u) : []);
    } catch (error) {
      toast.error('Failed to approve plan');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      toast.success('User deleted successfully');
      setUsers(prev => Array.isArray(prev) ? prev.filter(u => u.id !== userId) : []);
      setUserToDelete(null);
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      await apiClient('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUsers }),
      });
      toast.success(`Successfully deleted ${selectedUsers.length} users`);
      setUsers(prev => Array.isArray(prev) ? prev.filter(u => !selectedUsers.includes(u.id)) : []);
      setSelectedUsers([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to bulk delete users');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : [])
    .filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'usage') {
        comparison = (a.usage?.linksThisMonth || 0) - (b.usage?.linksThisMonth || 0);
      } else if (sortBy === 'plan') {
        comparison = (a.plan || '').localeCompare(b.plan || '');
      } else if (sortBy === 'role') {
        comparison = (a.role || '').localeCompare(b.role || '');
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className={cn(
          "text-3xl font-display font-bold flex items-center gap-3",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          <Shield className="text-brand" size={32} />
          {settings.find(s => s.key === 'site_name')?.value || "Admin"} Dashboard
        </h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
          {[
            { id: 'users', label: 'Users', icon: UserIcon },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'content', label: 'Content', icon: Layout },
            { id: 'domains', label: 'Domains', icon: Globe },
            { id: 'apiKeys', label: 'API Keys', icon: Key },
            { id: 'history', label: 'History', icon: History }
          ].filter(tab => {
            if (user?.role === 'admin') return true;
            if (user?.role === 'editor') return ['content', 'history'].includes(tab.id);
            if (user?.role === 'viewer') return ['history'].includes(tab.id);
            return false;
          }).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-brand text-white shadow-lg shadow-brand/20" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "pl-10 pr-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all w-full sm:w-64",
                    theme === 'dark' 
                      ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-brand/50" 
                      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand"
                  )}
                />
              </div>
              
              {user?.role === 'admin' && selectedUsers.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Trash2 size={16} />
                  {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
                </button>
              )}
            </div>
          </div>

      <div className={cn(
        "rounded-3xl border overflow-hidden shadow-xl backdrop-blur-sm",
        theme === 'dark' ? "bg-zinc-900 border-zinc-800 shadow-black/20" : "bg-white border-gray-100 shadow-gray-200/50"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={cn(
              "border-b",
              theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"
            )}>
              <tr>
                <th className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                  <button onClick={() => toggleSort('email')} className="flex items-center gap-1 hover:text-brand transition-colors">
                    User
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                  <button onClick={() => toggleSort('usage')} className="flex items-center gap-1 hover:text-brand transition-colors">
                    Usage
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                  <button onClick={() => toggleSort('role')} className="flex items-center gap-1 hover:text-brand transition-colors">
                    Role
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                  <button onClick={() => toggleSort('plan')} className="flex items-center gap-1 hover:text-brand transition-colors">
                    Plan
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                  <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-brand transition-colors">
                    Status
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Message</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Expires At</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-brand transition-colors">
                    Joined
                    <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme === 'dark' ? "divide-white/5" : "divide-gray-100")}>
              {tabLoading['users'] ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="px-6 py-4">
                      <Skeleton className="h-8 w-full" theme={theme} />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={cn(
                    "transition-colors",
                    theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50/50"
                  )}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          theme === 'dark' ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"
                        )}>
                          {user.email?.[0]?.toUpperCase() || <UserIcon size={14} />}
                        </div>
                        <div>
                          <div className={cn("font-medium text-sm", theme === 'dark' ? "text-gray-200" : "text-gray-900")}>
                            {user.name || 'No Name'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email || 'Anonymous'}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "text-xs font-bold",
                          (user.usage?.linksThisMonth || 0) > 40 ? "text-amber-500" : "text-brand"
                        )}>
                          {user.usage?.linksThisMonth || 0} links
                        </span>
                        <div className="w-20 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand transition-all"
                            style={{ width: `${Math.min(100, ((user.usage?.linksThisMonth || 0) / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                        user.role === 'admin' 
                          ? "bg-purple-500/10 text-purple-500" 
                          : user.role === 'editor'
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-gray-500/10 text-gray-500"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider w-fit",
                          user.plan === 'pro' || user.plan === 'enterprise'
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-gray-500/10 text-gray-500"
                        )}>
                          {user.plan}
                        </span>
                        {user.pendingPlan && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500 font-bold uppercase animate-pulse">
                              Pending: {user.pendingPlan}
                            </span>
                            <button 
                              onClick={() => handleApprovePlan(user)}
                              className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded hover:bg-emerald-600 transition-colors font-bold"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                        user.status === 'active' 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : user.status === 'pending'
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500"
                      )}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 truncate max-w-[100px] block" title={user.message || ''}>
                        {user.message || 'No message'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">
                          {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Never'}
                        </span>
                        {user.expiresAt && new Date(user.expiresAt) < new Date() && (
                          <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase w-fit">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                        {user?.role === 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                              )}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setUserToDelete(user)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                theme === 'dark' ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-red-50 text-gray-500 hover:text-red-600"
                              )}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : activeTab === 'settings' ? (
        tabLoading['settings'] ? <Skeleton className="h-64 w-full" theme={theme} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(settings) && settings.map((s) => (
              <div key={s.key} className={cn(
                "p-6 rounded-3xl border",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"
              )}>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block">
                  {s.key.replace(/_/g, ' ')}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    defaultValue={s.value}
                    onBlur={(e) => handleUpdateSetting(s.key, e.target.value)}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm",
                      theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'domains' ? (
        tabLoading['domains'] ? <Skeleton className="h-64 w-full" theme={theme} /> : (
          <DomainManager
            isOpen={true}
            onClose={() => {}}
            domains={domains}
            onAdd={handleAddDomain}
            onDelete={handleDeleteDomain}
            onVerify={handleVerifyDomain}
            theme={theme}
            standalone={true}
          />
        )
      ) : activeTab === 'apiKeys' ? (
        tabLoading['apiKeys'] ? <Skeleton className="h-64 w-full" theme={theme} /> : (
          <ApiKeyManager
            apiKeys={apiKeys}
            onGenerate={handleGenerateApiKey}
            onDelete={handleDeleteApiKey}
            theme={theme}
          />
        )
      ) : activeTab === 'history' ? (
        tabLoading['history'] ? <Skeleton className="h-64 w-full" theme={theme} /> : (
          <HistoryList
            history={history}
            theme={theme}
            onDelete={handleDeleteHistoryItem}
            onBulkDelete={handleBulkDeleteHistory}
            onClear={handleClearHistory}
            openShareModal={() => {}}
            openQrModal={() => {}}
            onItemClick={() => {}}
          />
        )
      ) : activeTab === 'content' ? (
        tabLoading['content'] ? <Skeleton className="h-64 w-full" theme={theme} /> : (
          <>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Landing Page Features</h3>
                {(user?.role === 'admin' || user?.role === 'editor') && (
                  <button 
                    onClick={() => handleUpdateFeature({ id: nanoid(), icon: 'Sparkles', title: 'New Feature', description: 'Description', displayOrder: features.length + 1 })}
                    className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Feature
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(features) && features.map((f) => (
                  <div key={f.id} className={cn(
                    "p-6 rounded-3xl border",
                    theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                          <Settings size={20} />
                        </div>
                        <input 
                          type="text"
                          defaultValue={f.title}
                          onBlur={(e) => handleUpdateFeature({ ...f, title: e.target.value })}
                          className="bg-transparent font-bold outline-none focus:ring-1 focus:ring-brand rounded px-1"
                        />
                      </div>
                      {(user?.role === 'admin' || user?.role === 'editor') && (
                        <button 
                          onClick={() => handleDeleteFeature(f.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea 
                      defaultValue={f.description}
                      onBlur={(e) => handleUpdateFeature({ ...f, description: e.target.value })}
                      className={cn(
                        "w-full bg-transparent text-sm text-gray-500 outline-none focus:ring-1 focus:ring-brand rounded p-1 resize-none h-20",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}
                    />
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Icon:</span>
                          <select 
                            value={f.icon}
                            onChange={(e) => handleUpdateFeature({ ...f, icon: e.target.value })}
                            className={cn(
                              "text-[10px] px-2 py-1 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 transition-all font-bold uppercase tracking-widest",
                              theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                            )}
                          >
                            {['Sparkles', 'Zap', 'Shield', 'Globe', 'Activity', 'BarChart2', 'Lock', 'Cpu', 'Layers', 'MousePointer2', 'Share2', 'QrCode'].map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Order:</span>
                        <input 
                          type="number"
                          defaultValue={f.displayOrder}
                          onBlur={(e) => handleUpdateFeature({ ...f, displayOrder: parseInt(e.target.value) })}
                          className="text-[10px] bg-transparent font-mono outline-none focus:ring-1 focus:ring-brand rounded px-1 w-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 mt-12 pt-12 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Landing Page FAQs</h3>
                {(user?.role === 'admin' || user?.role === 'editor') && (
                  <button 
                    onClick={() => handleUpdateFaq({ id: nanoid(), question: 'New Question', answer: 'Answer', displayOrder: faqs.length + 1 })}
                    className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add FAQ
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {Array.isArray(faqs) && faqs.map((faq) => (
                  <div key={faq.id} className={cn(
                    "p-6 rounded-3xl border",
                    theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100 shadow-sm"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <input 
                        type="text"
                        defaultValue={faq.question}
                        onBlur={(e) => handleUpdateFaq({ ...faq, question: e.target.value })}
                        className="flex-1 bg-transparent font-bold outline-none focus:ring-1 focus:ring-brand rounded px-1"
                      />
                      {(user?.role === 'admin' || user?.role === 'editor') && (
                        <button 
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-4"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea 
                      defaultValue={faq.answer}
                      onBlur={(e) => handleUpdateFaq({ ...faq, answer: e.target.value })}
                      className={cn(
                        "w-full bg-transparent text-sm text-gray-500 outline-none focus:ring-1 focus:ring-brand rounded p-1 resize-none h-20",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}
                    />
                    <div className="mt-4 flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Order:</span>
                        <input 
                          type="number"
                          defaultValue={faq.displayOrder}
                          onBlur={(e) => handleUpdateFaq({ ...faq, displayOrder: parseInt(e.target.value) })}
                          className="text-[10px] bg-transparent font-mono outline-none focus:ring-1 focus:ring-brand rounded px-1 w-10"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!faq.hidden}
                          onChange={(e) => handleUpdateFaq({ ...faq, hidden: e.target.checked })}
                          className="rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Hidden</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      ) : null}{/* Delete Confirmation Modal */}
      <DeleteUserModal 
        isOpen={!!userToDelete} 
        onClose={() => setUserToDelete(null)} 
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete.id)} 
        userEmail={userToDelete?.email || null} 
        theme={theme} 
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={handleUpdateUser}
        theme={theme}
      />
    </div>
  );
};
