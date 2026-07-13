import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { CollectionRequest, RequestStatus } from '@/types';

export function HistoryPage() {
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [materialFilter, setMaterialFilter] = useState('');

  useEffect(() => {
    apiClient.get<CollectionRequest[]>('/requests')
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (materialFilter && r.materialType !== materialFilter) return false;
    return true;
  });

  const uniqueMaterials = [...new Set(requests.map((r) => r.materialType))];

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Request History</h1>

      <div className="flex gap-4 mb-6">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter by Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus | '')}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 dark:border-gray-600"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="on_the_way">On the Way</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>
        <div>
          <label htmlFor="materialFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter by Material
          </label>
          <select
            id="materialFilter"
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 dark:border-gray-600"
          >
            <option value="">All</option>
            {uniqueMaterials.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((request) => (
          <Link key={request.id} to={`/resident/requests/${request.id}`} className="block">
            <Card hoverable>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{request.materialType}</p>
                  <p className="text-sm text-gray-500">{request.quantityKg} kg</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No requests found</p>
        )}
      </div>
    </div>
  );
}
