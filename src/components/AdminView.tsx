import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Shield, Trash2, Check, X, Search, User, Settings, Layout, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LandingFeature, LandingFaq } from '../types';
import { DeleteUserModal } from './DeleteUserModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminViewProps {
  theme: 'light' | 'dark';
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

export const AdminView: React.FC<AdminViewProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'content'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [features, setFeatures] = useState<LandingFeature[]>([]);
  const [faqs, setFaqs] = useState<LandingFaq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    role: '', 
    plan: '', 
    status: '', 
    expiresAt: '', 
    pendingPlan: '',
    name: '',
    email: '',
    message: ''
  });

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'content') fetchContent();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<UserData[]>('/api/admin/users');
      if (Array.isArray(data)) {
        const uniqueUsers = Array.from(new Map(data.map(u => [u.id, u])).values());
        setUsers(uniqueUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<Setting[]>('/api/admin/settings');
      if (Array.isArray(data)) {
        const uniqueSettings = Array.from(new Map(data.map(s => [s.key, s])).values());
        setSettings(uniqueSettings);
      } else {
        setSettings([]);
      }
    } catch (error) {
      toast.error('Failed to fetch settings');
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContent = async () => {
    setIsLoading(true);
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
    } catch (error) {
      toast.error('Failed to fetch content');
      setFeatures([]);
      setFaqs([]);
    } finally {
      setIsLoading(false);
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

  const handleUpdateUser = async (userId: string) => {
    try {
      await apiClient(`/api/admin/users/${userId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      toast.success('User updated successfully');
      setUsers(prev => Array.isArray(prev) ? prev.map(u => u.id === userId ? { ...u, ...editForm, expiresAt: editForm.expiresAt || null, pendingPlan: editForm.pendingPlan || null } : u) : []);
      setEditingUserId(null);
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className={cn(
          "text-3xl font-display font-bold flex items-center gap-3",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          <Shield className="text-brand" size={32} />
          Admin Dashboard
        </h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
          {[
            { id: 'users', label: 'Users', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'content', label: 'Content', icon: Layout }
          ].map((tab) => (
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
            <div className="relative w-full sm:w-auto">
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
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">User</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Usage</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Role</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" title="The subscription level of the user (Free, Pro, Enterprise)">Plan</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" title="The current account status (Active, Inactive, Pending)">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Message</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Expires At</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Joined</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme === 'dark' ? "divide-white/5" : "divide-gray-100")}>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={cn(
                    "transition-colors",
                    theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                  )}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          theme === 'dark' ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"
                        )}>
                          {user.email?.[0]?.toUpperCase() || <User size={14} />}
                        </div>
                        <div>
                          {editingUserId === user.id ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Name"
                                className={cn(
                                  "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20",
                                  theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                                )}
                              />
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="Email"
                                className={cn(
                                  "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20",
                                  theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                                )}
                              />
                            </div>
                          ) : (
                            <>
                              <div className={cn("font-medium text-sm", theme === 'dark' ? "text-gray-200" : "text-gray-900")}>
                                {user.name || 'No Name'}
                              </div>
                              <div className="text-xs text-gray-500">{user.email || 'Anonymous'}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{user.id}</div>
                            </>
                          )}
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
                      {editingUserId === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20",
                            theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                          )}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                          user.role === 'admin' 
                            ? "bg-purple-500/10 text-purple-500" 
                            : "bg-gray-500/10 text-gray-500"
                        )}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <select
                          value={editForm.plan}
                          onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20",
                            theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                          )}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      ) : (
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
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20",
                            theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                          )}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      ) : (
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
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <input
                          type="text"
                          value={editForm.message}
                          onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                          placeholder="Admin message"
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20 w-32",
                            theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                          )}
                        />
                      ) : (
                        <span className="text-xs text-gray-500 truncate max-w-[100px] block" title={user.message || ''}>
                          {user.message || 'No message'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <input
                          type="date"
                          value={(() => {
                            try {
                              return editForm.expiresAt ? new Date(editForm.expiresAt).toISOString().split('T')[0] : '';
                            } catch {
                              return '';
                            }
                          })()}
                          onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs border outline-none focus:ring-2 focus:ring-brand/20 w-32",
                            theme === 'dark' ? "bg-black border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                          )}
                        />
                      ) : (
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
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingUserId === user.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateUser(user.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditForm({ 
                                  role: user.role, 
                                  plan: user.plan, 
                                  status: user.status || 'active', 
                                  expiresAt: user.expiresAt || '',
                                  pendingPlan: user.pendingPlan || '',
                                  name: user.name || '',
                                  email: user.email || '',
                                  message: user.message || ''
                                });
                              }}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                              )}
                              title="Edit"
                            >
                              <Settings size={14} />
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
                          </>
                        )}
                      </div>
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
      ) : (
        <>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Landing Page Features</h3>
            <button 
              onClick={() => handleUpdateFeature({ id: nanoid(), icon: 'Sparkles', title: 'New Feature', description: 'Description', displayOrder: features.length + 1 })}
              className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              Add Feature
            </button>
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
                      {/* Icon selector would be better, but let's keep it simple */}
                      <Settings size={20} />
                    </div>
                    <input 
                      type="text"
                      defaultValue={f.title}
                      onBlur={(e) => handleUpdateFeature({ ...f, title: e.target.value })}
                      className="bg-transparent font-bold outline-none focus:ring-1 focus:ring-brand rounded px-1"
                    />
                  </div>
                  <button 
                    onClick={() => handleDeleteFeature(f.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
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
                    <input 
                      type="text"
                      defaultValue={f.icon}
                      onBlur={(e) => handleUpdateFeature({ ...f, icon: e.target.value })}
                      className="text-[10px] bg-transparent font-mono outline-none focus:ring-1 focus:ring-brand rounded px-1"
                    />
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
            <button 
              onClick={() => handleUpdateFaq({ id: nanoid(), question: 'New Question', answer: 'Answer', displayOrder: faqs.length + 1 })}
              className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              Add FAQ
            </button>
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
                  <button 
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-4"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea 
                  defaultValue={faq.answer}
                  onBlur={(e) => handleUpdateFaq({ ...faq, answer: e.target.value })}
                  className={cn(
                    "w-full bg-transparent text-sm text-gray-500 outline-none focus:ring-1 focus:ring-brand rounded p-1 resize-none h-20",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}
                />
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Order:</span>
                  <input 
                    type="number"
                    defaultValue={faq.displayOrder}
                    onBlur={(e) => handleUpdateFaq({ ...faq, displayOrder: parseInt(e.target.value) })}
                    className="text-[10px] bg-transparent font-mono outline-none focus:ring-1 focus:ring-brand rounded px-1 w-10"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteUserModal 
        isOpen={!!userToDelete} 
        onClose={() => setUserToDelete(null)} 
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete.id)} 
        userEmail={userToDelete?.email || null} 
        theme={theme} 
      />
    </div>
  );
};
