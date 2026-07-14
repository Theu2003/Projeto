import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { FadeIn } from '@/components/FadeIn';
import { CollectionRequest } from '@/types';
import { MapView } from '@/components/MapView';

export function MapViewPage() {
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    apiClient
      .get<CollectionRequest[]>('/requests?status=pending')
      .then(setRequests)
      .catch(() => setError('Falha ao carregar solicitações pendentes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  const markers = requests.map((req) => ({
    id: req.id,
    position: { latitude: req.latitude ?? 0, longitude: req.longitude ?? 0 },
    title: `${req.materialType} - ${req.address}`,
    status: req.status,
  }));

  return (
    <div>
      <FadeIn type="fade-down" duration={500}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mapa
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {requests.length} pendentes
            </span>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 active:scale-95"
              aria-label="Atualizar"
            >
              Atualizar
            </button>
          </div>
        </div>
      </FadeIn>

      <FadeIn type="fade-up" duration={500} delay={200}>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhuma solicitação pendente
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
            <MapView
              center={requests[0] ? { latitude: requests[0].latitude ?? 0, longitude: requests[0].longitude ?? 0 } : null}
              markers={markers}
            />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
