import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { StarRating } from '@/components/StarRating';
import { CollectionRequest, RequestStatus } from '@/types';

const statusToTimelineStep: Record<RequestStatus, string> = {
  pending: 'Request Created',
  accepted: 'Accepted',
  on_the_way: 'On the Way',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

const timelineOrder: RequestStatus[] = ['pending', 'accepted', 'on_the_way', 'completed'];

function buildTimelineSteps(currentStatus: RequestStatus) {
  if (currentStatus === 'cancelled') {
    return [
      { label: 'Request Created', completed: true },
      { label: 'Cancelled', completed: true },
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

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.get<CollectionRequest>(`/requests/${id}`)
      .then(setRequest)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleCancel() {
    if (!id) return;
    try {
      await apiClient.put(`/requests/${id}/cancel`);
      const updated = await apiClient.get<CollectionRequest>(`/requests/${id}`);
      setRequest(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
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
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!request) return <div className="text-center py-8 text-gray-500">Request not found</div>;

  const timelineSteps = buildTimelineSteps(request.status);
  const canCancel = request.status === 'pending' || request.status === 'accepted';
  const canReview = request.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Request Details</h1>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold capitalize">{request.materialType}</h2>
          <StatusBadge status={request.status} />
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><span className="font-medium">Quantity:</span> {request.quantityKg} kg</p>
          {request.address && <p><span className="font-medium">Address:</span> {request.address}</p>}
          {request.observations && <p><span className="font-medium">Notes:</span> {request.observations}</p>}
        </div>
      </Card>

      <Card title="Timeline" className="mb-6">
        <Timeline steps={timelineSteps} />
      </Card>

      {request.company && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-2">Company</h3>
          <p className="text-gray-600 dark:text-gray-400">{request.company.name}</p>
          <p className="text-sm text-gray-500">Rating: {request.company.rating}/5</p>
        </Card>
      )}

      {canCancel && (
        <div className="mb-6">
          <Button variant="danger" onClick={handleCancel}>Cancel Request</Button>
        </div>
      )}

      {canReview && (
        <Card title="Leave a Review" className="mb-6">
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comment
              </label>
              <textarea
                id="comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 dark:border-gray-600"
                placeholder="Share your experience..."
              />
            </div>
            <Button type="submit" isLoading={isSubmittingReview}>Submit Review</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
