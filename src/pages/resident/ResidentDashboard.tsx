import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { ResidentDashboardData, CollectionRequest } from '@/types';

export function ResidentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ResidentDashboardData | null>(null);
  const [recentRequests, setRecentRequests] = useState<CollectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, requestsData] = await Promise.all([
          apiClient.get<ResidentDashboardData>('/users/dashboard'),
          apiClient.get<CollectionRequest[]>('/requests'),
        ]);
        setStats(statsData);
        setRecentRequests(requestsData.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.totalRequests ?? 0}</p>
            <p className="text-gray-500 mt-1">Total Requests</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.completedRequests ?? 0}</p>
            <p className="text-gray-500 mt-1">Completed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.points ?? 0}</p>
            <p className="text-gray-500 mt-1">Points</p>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Requests</h2>
        <Link
          to="/resident/requests/new"
          className="text-green-600 hover:text-green-700 font-medium"
        >
          + New Request
        </Link>
      </div>

      <div className="space-y-3">
        {recentRequests.map((request) => (
          <Link
            key={request.id}
            to={`/resident/requests/${request.id}`}
            className="block"
          >
            <Card hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.materialType}</p>
                  <p className="text-sm text-gray-500">{request.quantityKg} kg</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </Card>
          </Link>
        ))}
        {recentRequests.length === 0 && (
          <p className="text-center text-gray-500 py-8">No requests yet</p>
        )}
      </div>
    </div>
  );
}
