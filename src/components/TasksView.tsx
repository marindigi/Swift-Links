import React, { useState, useEffect } from 'react';
import { Check, Trash2, Plus, Calendar, Clock, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, User } from '../types';
import { LimitReachedModal } from './LimitReachedModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TasksViewProps {
  theme: 'light' | 'dark';
  user: User | null;
  onUpgrade?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ theme, user, onUpgrade }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Task[]>('/api/tasks');
      if (Array.isArray(data)) {
        const uniqueTasks = Array.from(new Map(data.map(t => [t.id, t])).values());
        setTasks(uniqueTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Check limit for free users
    if (user?.plan === 'free' && tasks.length >= 3) {
      setShowLimitModal(true);
      return;
    }

    setIsCreating(true);
    try {
      const data = await apiClient<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          dueDate: newTaskDueDate || null
        })
      });

      setTasks([data, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      toast.success('Note created');
    } catch (error: any) {
      if (error.message?.includes('limit reached')) {
        setShowLimitModal(true);
      } else {
        toast.error(error.message || 'Failed to create note');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const data = await apiClient<Task>(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed })
      });
      
      setTasks(tasks.map(t => t.id === task.id ? data : t));
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await apiClient(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };


  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className={cn(
          "text-3xl font-display font-bold flex items-center gap-3",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          <Sparkles className="text-brand" size={32} />
          AI Notes
        </h2>
      </div>

      <div className={cn(
        "mb-8 p-6 rounded-3xl border shadow-lg backdrop-blur-sm",
        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-gray-200/50"
      )}>
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Add a new note..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border outline-none transition-all",
                theme === 'dark' 
                  ? "bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-brand/50" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand"
              )}
            />
            <button
              type="submit"
              disabled={isCreating || !newTaskTitle.trim()}
              className="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {isCreating ? <Clock size={20} className="animate-spin" /> : <Plus size={20} />}
              <span>Add</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative group w-full sm:w-auto">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="text-gray-400" size={16} />
              </div>
              <input
                type="datetime-local"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className={cn(
                  "w-full sm:w-auto pl-10 pr-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none transition-all cursor-pointer",
                  theme === 'dark' 
                    ? "bg-white/5 border-white/10 text-gray-400 focus:text-white focus:border-brand/50" 
                    : "bg-gray-50 border-gray-200 text-gray-500 focus:text-gray-900 focus:border-brand/50"
                )}
              />
            </div>
            {newTaskDueDate && (
              <button
                type="button"
                onClick={() => setNewTaskDueDate('')}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors mt-2 sm:mt-0"
              >
                Clear date
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading notes...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-gray-400" size={32} />
            </div>
            <p>No notes yet. Add one above!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={task.id}
              className={cn(
                "group p-4 rounded-2xl border transition-all flex items-center gap-4",
                theme === 'dark' 
                  ? "bg-white/5 border-white/5 hover:border-white/10" 
                  : "bg-white border-gray-100 hover:border-gray-200 shadow-sm",
                task.completed && "opacity-60"
              )}
            >
              <button
                onClick={() => handleToggleComplete(task)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                  task.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : theme === 'dark' ? "border-gray-600 hover:border-emerald-500" : "border-gray-300 hover:border-emerald-500"
                )}
              >
                {task.completed && <Check size={14} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium truncate transition-all",
                  task.completed && "line-through text-gray-500"
                )}>
                  {task.title}
                </h3>
                {task.dueDate && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs mt-1",
                    new Date(task.dueDate) < new Date() && !task.completed ? "text-red-500" : "text-gray-500"
                  )}>
                    <Clock size={12} />
                    <span>{new Date(task.dueDate).toLocaleString()}</span>
                    {new Date(task.dueDate) < new Date() && !task.completed && (
                      <span className="font-bold uppercase tracking-wider text-[10px] ml-1">Overdue</span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className={cn(
                  "p-2 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all",
                  theme === 'dark' ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                )}
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
          </AnimatePresence>
        )}
      </div>

      {/* Limit Reached Modal */}
      <LimitReachedModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        onUpgrade={onUpgrade} 
        theme={theme} 
      />
    </div>
  );
};
