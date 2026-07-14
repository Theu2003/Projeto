import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { FormSkeleton } from '@/components/Skeleton';
import { CollectionRequest } from '@/types';
import { Input } from '@/components/Input';

export function CollectionProcessPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<CollectionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realWeight, setRealWeight] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<CollectionRequest>(`/requests/${id}`)
      .then(setRequest)
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartJourney = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/requests/${id}/on-the-way`);
      setRequest((prev) => (prev ? { ...prev, status: 'on_the_way' } : null));
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const weight = parseFloat(realWeight);
    if (isNaN(weight) || weight <= 0) return;

    setActionLoading(true);
    try {
      await apiClient.put(`/requests/${id}/complete`, { realWeight: weight });
      setRequest((prev) =>
        prev ? { ...prev, status: 'completed', realWeight: weight } : null
      );
      setSuccessMessage('Collection completed successfully!');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!request) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Collection Process
      </h2>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        {request.user && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Customer</h3>
            <p className="text-gray-600 dark:text-gray-400">{request.user.name}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Material</h4>
            <p className="text-gray-900 dark:text-gray-100">{request.materialType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Estimated Quantity</h4>
            <p className="text-gray-900 dark:text-gray-100">{request.quantityKg} kg</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500">Address</h4>
          <p className="text-gray-900 dark:text-gray-100">{request.address}</p>
        </div>

        <div className="mt-6">
          {request.status === 'accepted' && (
            <button
              onClick={handleStartJourney}
              disabled={actionLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Processing...' : 'Start Journey'}
            </button>
          )}

          {request.status === 'on_the_way' && (
            <div className="space-y-4">
              <Input
                label="Real Weight (kg)"
                type="number"
                step="0.1"
                min="0"
                value={realWeight}
                onChange={(e) => setRealWeight(e.target.value)}
                placeholder="Enter actual weight"
              />
              <button
                onClick={handleComplete}
                disabled={actionLoading || !realWeight}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Complete Collection'}
              </button>
            </div>
          )}

          {request.status === 'completed' && (
            <div className="text-center py-4 text-green-600 dark:text-green-400 font-medium">
              Collection Completed
              {request.realWeight && (
                <span className="block text-sm mt-1">Real weight: {request.realWeight} kg</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
