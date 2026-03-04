import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '../lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TeamManagement } from './TeamManagement';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TeamDashboardProps {
  teamId: string;
  theme: 'light' | 'dark';
  isOwner: boolean;
  isAdmin: boolean;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ teamId, theme, isOwner, isAdmin }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient(`/api/teams/${teamId}/analytics`);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch team analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Failed to load dashboard</div>;

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  return (
    <div className="space-y-6">
      <TeamManagement teamId={teamId} theme={theme} isOwner={isOwner} isAdmin={isAdmin} />

      <div className={cn(
        "p-6 rounded-2xl border",
        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      )}>
        <h2 className="text-xl font-bold mb-4">Total Clicks</h2>
        <p className="text-4xl font-bold text-brand">{data.totalClicks}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(
          "p-6 rounded-2xl border",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
        )}>
          <h2 className="text-xl font-bold mb-4">Top Links</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topLinks}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shortUrl" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clickCount" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cn(
          "p-6 rounded-2xl border",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
        )}>
          <h2 className="text-xl font-bold mb-4">Geographic Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.geoDistribution} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={80} label>
                {data.geoDistribution.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
