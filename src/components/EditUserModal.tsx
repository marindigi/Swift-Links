import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, User, Mail, Shield, CreditCard, Calendar, MessageSquare, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onSave: (userId: string, data: any) => Promise<void>;
  theme: 'light' | 'dark';
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave, theme }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    plan: '',
    status: '',
    expiresAt: '',
    pendingPlan: '',
    message: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        plan: user.plan || 'free',
        status: user.status || 'active',
        expiresAt: user.expiresAt ? new Date(user.expiresAt).toISOString().split('T')[0] : '',
        pendingPlan: user.pendingPlan || '',
        message: user.message || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      await onSave(user.id, form);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
            "relative w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border",
            theme === 'dark' ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
          )}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    Edit User Account
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Update permissions and subscription details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  theme === 'dark' ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                )}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <User size={12} /> Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-medium",
                        theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Mail size={12} /> Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-medium",
                        theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Shield size={12} /> Account Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-bold uppercase tracking-widest",
                        theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <CreditCard size={12} /> Subscription Plan
                    </label>
                    <select
                      value={form.plan}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-bold uppercase tracking-widest",
                        theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Activity size={12} /> Account Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-bold uppercase tracking-widest",
                        theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Calendar size={12} /> Expiration Date
                    </label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-medium",
                        theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <MessageSquare size={12} /> Admin Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Visible to the user on their dashboard..."
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-medium resize-none h-24",
                    theme === 'dark' ? "bg-black/20 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  )}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-6 py-3.5 bg-brand text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-brand/20 hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
