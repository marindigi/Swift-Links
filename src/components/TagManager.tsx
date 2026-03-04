import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Tag } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TagManagerProps {
  tags: Tag[];
  theme: 'light' | 'dark';
  onUpdate: () => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ tags, theme, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const deleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await apiClient(`/api/tags/${tagId}`, {
        method: 'DELETE',
        successMessage: 'Tag deleted'
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete tag', error);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const saveEdit = async (tagId: string) => {
    try {
      await apiClient(`/api/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
        successMessage: 'Tag updated'
      });
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tag', error);
    }
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border",
      theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
    )}>
      <h2 className="text-xl font-bold mb-4">Manage Tags</h2>
      <div className="space-y-2">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            {editingId === tag.id ? (
              <div className="flex items-center gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={cn(
                    "p-1 rounded-lg border text-xs",
                    theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  )}
                />
                <button onClick={() => saveEdit(tag.id)} className="text-emerald-500"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={16} /></button>
              </div>
            ) : (
              <>
                <span>{tag.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(tag)} className="text-gray-500 hover:text-brand"><Edit2 size={16} /></button>
                  <button onClick={() => deleteTag(tag.id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
