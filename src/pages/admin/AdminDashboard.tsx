import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { AdminStats } from '@/types';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(() => setError('Failed to load platform statistics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Active Users', value: stats.activeUsers },
    { label: 'Total Companies', value: stats.totalCompanies },
    { label: 'Approved Companies', value: stats.approvedCompanies },
    { label: 'Total Requests', value: stats.totalRequests },
    { label: 'Completed Requests', value: stats.completedRequests },
    { label: 'Pending Requests', value: stats.pendingRequests },
    { label: 'Total Points', value: stats.totalPoints },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Platform Statistics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(card.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
