import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { CompanyRequestDetailSkeleton } from '@/components/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { CollectionRequest } from '@/types';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<CollectionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<CollectionRequest>(`/requests/${id}`)
      .then(setRequest)
      .catch(() => setError('Falha ao carregar'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/requests/${id}/accept`);
      setRequest((prev) => (prev ? { ...prev, status: 'accepted' } : null));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/requests/${id}/reject`);
      setRequest((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <CompanyRequestDetailSkeleton />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!request) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Detalhes da Solicitação
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Solicitação #{request.id.slice(0, 8)}</span>
          <StatusBadge status={request.status} />
        </div>

        {request.user && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Cliente</h3>
            <p className="text-gray-600 dark:text-gray-400">{request.user.name}</p>
            {request.user.phone && (
              <p className="text-sm text-gray-500">{request.user.phone}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Material</h4>
            <p className="text-gray-900 dark:text-gray-100">{request.materialType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Quantidade</h4>
            <p className="text-gray-900 dark:text-gray-100">{request.quantityKg} kg</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Data</h4>
            <p className="text-gray-900 dark:text-gray-100">{request.desiredDate}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Horário</h4>
            <p className="text-gray-900 dark:text-gray-100">{request.desiredTime}</p>
          </div>
        </div>

        <div className="mb-4">            <h4 className="text-sm font-medium text-gray-500">Endereço</h4>
          <p className="text-gray-900 dark:text-gray-100">{request.address}</p>
        </div>

        {request.observations && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500">Observações</h4>
            <p className="text-gray-600 dark:text-gray-400">{request.observations}</p>
          </div>
        )}

        {request.status === 'pending' && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Processando...' : 'Aceitar'}
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Processando...' : 'Recusar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
