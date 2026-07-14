import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { StarRating } from '@/components/StarRating';
import { RequestDetailSkeleton } from '@/components/Skeleton';
import { CollectionRequest, RequestStatus, Material } from '@/types';

const statusToTimelineStep: Record<RequestStatus, string> = {
  pending: 'Solicitação Criada',
  accepted: 'Aceito',
  on_the_way: 'A Caminho',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  rescheduled: 'Reagendado',
};

const timelineOrder: RequestStatus[] = ['pending', 'accepted', 'on_the_way', 'completed'];

function buildTimelineSteps(currentStatus: RequestStatus) {
  if (currentStatus === 'cancelled') {
    return [
      { label: 'Solicitação Criada', completed: true },
      { label: 'Cancelado', completed: true },
    ];
  }
  const currentIndex = timelineOrder.indexOf(currentStatus);
  return timelineOrder.map((status, index) => ({
    label: statusToTimelineStep[status],
    completed: index <= currentIndex,
  }));
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<CollectionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [editMaterialType, setEditMaterialType] = useState('');
  const [editQuantityKg, setEditQuantityKg] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editDesiredDate, setEditDesiredDate] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.get<CollectionRequest>(`/requests/${id}`)
      .then(setRequest)
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar'))
      .finally(() => setIsLoading(false));
  }, [id]);

  function startEditing() {
    if (!request) return;
    setEditMaterialType(request.materialType);
    setEditQuantityKg(String(request.quantityKg));
    setEditObservations(request.observations || '');
    setEditDesiredDate(request.desiredDate || '');
    setEditError(null);
    setIsEditing(true);
    setMaterialsLoading(true);
    apiClient.get<Material[]>('/materials').then(setMaterials).catch(() => {}).finally(() => setMaterialsLoading(false));
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!id || !request) return;

    if (!editMaterialType) {
      setEditError('Selecione um material');
      return;
    }
    const qty = parseFloat(editQuantityKg);
    if (isNaN(qty) || qty <= 0) {
      setEditError('Quantidade deve ser positiva');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      await apiClient.put(`/requests/${id}`, {
        materialType: editMaterialType,
        quantityKg: qty,
        observations: editObservations || undefined,
        desiredDate: editDesiredDate || undefined,
      });
      const updated = await apiClient.get<CollectionRequest>(`/requests/${id}`);
      setRequest(updated);
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Falha ao editar solicitação');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    try {
      await apiClient.put(`/requests/${id}/cancel`);
      const updated = await apiClient.get<CollectionRequest>(`/requests/${id}`);
      setRequest(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cancelar');
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || reviewRating === 0) return;
    setIsSubmittingReview(true);
    try {
      await apiClient.post('/reviews', {
        requestId: id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setReviewRating(0);
      setReviewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar avaliação');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (isLoading) return <RequestDetailSkeleton />;
  if (error) return <div className="text-center py-8 text-red-500">Erro: {error}</div>;
  if (!request) return <div className="text-center py-8 text-gray-500">Solicitação não encontrada</div>;

  const timelineSteps = buildTimelineSteps(request.status);
  const canEdit = request.status === 'pending' && !isEditing;
  const canCancel = (request.status === 'pending' || request.status === 'accepted') && !isEditing;
  const canReview = request.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Detalhes da Solicitação</h1>

      {isEditing ? (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Editar Solicitação</h2>

          {editError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm mb-4">
              {editError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="editMaterialType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Material <span className="text-red-500 ml-1">*</span>
              </label>
              {materialsLoading ? (
                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 animate-pulse h-10" />
              ) : (
              <select
                id="editMaterialType"
                value={editMaterialType}
                onChange={(e) => setEditMaterialType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 dark:border-gray-600"
              >
                <option value="">Selecione o material</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.name.toLowerCase()}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
              )}
            </div>

            <Input
              label="Quantidade (kg)"
              type="number"
              step="0.1"
              min="0"
              required
              value={editQuantityKg}
              onChange={(e) => setEditQuantityKg(e.target.value)}
            />

            <Input
              label="Data Desejada"
              type="date"
              value={editDesiredDate}
              onChange={(e) => setEditDesiredDate(e.target.value)}
            />

            <div>
              <label htmlFor="editObservations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                id="editObservations"
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 dark:border-gray-600"
                placeholder="Instruções especiais..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveEdit} isLoading={editSubmitting}>
                Salvar Alterações
              </Button>
              <Button variant="secondary" onClick={cancelEditing}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold capitalize">{request.materialType}</h2>
              <StatusBadge status={request.status} />
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">Quantidade:</span> {request.quantityKg} kg</p>
              {request.address && <p><span className="font-medium">Endereço:</span> {request.address}</p>}
              {request.observations && <p><span className="font-medium">Observações:</span> {request.observations}</p>}
              {request.desiredDate && <p><span className="font-medium">Data desejada:</span> {request.desiredDate}</p>}
            </div>
          </Card>

          <Card title="Linha do Tempo" className="mb-6">
            <Timeline steps={timelineSteps} />
          </Card>

          {request.company && (
            <Card className="mb-6">
              <h3 className="font-semibold mb-2">Empresa</h3>
              <p className="text-gray-600 dark:text-gray-400">{request.company.name}</p>
              <p className="text-sm text-gray-500">Avaliação: {request.company.rating}/5</p>
            </Card>
          )}

          {(canEdit || canCancel) && (
            <div className="mb-6 flex gap-3">
              {canEdit && (
                <Button variant="secondary" onClick={startEditing}>
                  Editar Solicitação
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" onClick={handleCancel}>
                  Cancelar Solicitação
                </Button>
              )}
            </div>
          )}

          {canReview && (
            <Card title="Deixe uma Avaliação" className="mb-6">
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avaliação</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comentário
                  </label>
                  <textarea
                    id="comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 dark:border-gray-600"
                    placeholder="Compartilhe sua experiência..."
                  />
                </div>
                <Button type="submit" isLoading={isSubmittingReview}>Enviar Avaliação</Button>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
