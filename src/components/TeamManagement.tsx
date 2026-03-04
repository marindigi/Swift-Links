import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Trash2, UserPlus } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TeamManagementProps {
  teamId: string;
  theme: 'light' | 'dark';
  isOwner: boolean;
  isAdmin: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ teamId, theme, isOwner, isAdmin }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    const data = await apiClient(`/api/teams/${teamId}/members`);
    setMembers(data);
  };

  const inviteMember = async () => {
    await apiClient(`/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
      successMessage: 'Member invited'
    });
    setEmail('');
    fetchMembers();
  };

  const updateRole = async (userId: string, newRole: string) => {
    await apiClient(`/api/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
      successMessage: 'Role updated'
    });
    fetchMembers();
  };

  const removeMember = async (userId: string) => {
    await apiClient(`/api/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      successMessage: 'Member removed'
    });
    fetchMembers();
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border",
      theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
    )}>
      <h2 className="text-xl font-bold mb-4">Team Members</h2>
      
      {(isOwner || isAdmin) && (
        <div className="flex gap-2 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User email"
            className={cn(
              "flex-1 p-2 rounded-xl border",
              theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
            )}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className={cn(
            "p-2 rounded-xl border",
            theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
          )}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={inviteMember} className="px-4 py-2 bg-brand text-white rounded-xl flex items-center gap-2">
            <UserPlus size={16} /> Invite
          </button>
        </div>
      )}

      <div className="space-y-2">
        {members.map(member => (
          <div key={member.userId} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <span>{member.email}</span>
            <div className="flex items-center gap-2">
              {(isOwner || isAdmin) && member.role !== 'owner' ? (
                <>
                  <select value={member.role} onChange={(e) => updateRole(member.userId, e.target.value)} className={cn(
                    "p-1 rounded-lg border",
                    theme === 'dark' ? "bg-black/40 border-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  )}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => removeMember(member.userId)} className="text-red-500"><Trash2 size={16} /></button>
                </>
              ) : (
                <span className="text-sm font-bold uppercase">{member.role}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
