import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../types';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationCenterProps {
  theme: 'light' | 'dark';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ theme }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient<Notification[]>('/api/notifications');
      if (Array.isArray(data)) {
        const uniqueNotifications = Array.from(new Map(data.map(n => [n.id, n])).values());
        setNotifications(uniqueNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-all",
          theme === 'dark' ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] overflow-hidden rounded-2xl border shadow-2xl z-50 flex flex-col",
                theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"
              )}
            >
              <div className={cn(
                "p-4 border-bottom flex items-center justify-between",
                theme === 'dark' ? "border-white/10" : "border-gray-100"
              )}>
                <h3 className="font-bold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] uppercase tracking-wider font-bold text-brand hover:opacity-80"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-white/5 divide-gray-100">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={cn(
                          "p-4 transition-colors group",
                          !notification.read && (theme === 'dark' ? "bg-brand/5" : "bg-brand/5"),
                          theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            notification.type === 'task_reminder' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {notification.type === 'task_reminder' ? <Clock size={16} /> : <Info size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={cn(
                                "text-sm font-bold truncate",
                                !notification.read ? (theme === 'dark' ? "text-white" : "text-gray-900") : "text-gray-500"
                              )}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button 
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-[10px] font-bold text-brand flex items-center gap-1"
                                >
                                  <Check size={12} />
                                  Mark read
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNotification(notification.id)}
                                className="text-[10px] font-bold text-red-500 flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
