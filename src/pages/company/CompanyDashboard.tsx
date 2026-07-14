import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { FadeIn } from '@/components/FadeIn';
import { DashboardSkeleton } from '@/components/Skeleton';
import { CompanyDashboardData } from '@/types';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= rating ? '★' : '☆');
  }
  return <span className="text-yellow-500">{stars.join('')}</span>;
}

export function CompanyDashboard() {
  const [data, setData] = useState<CompanyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<CompanyDashboardData>('/companies/dashboard')
      .then(setData)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardSkeleton type="company" />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!data) return null;

  const statCards = [
    { label: 'Total Requests', value: data.stats.totalRequests },
    { label: 'Pending', value: data.stats.pendingRequests },
    { label: 'Completed Today', value: data.stats.completedToday },
    { label: 'Total Collected (kg)', value: data.stats.totalCollected },
  ];

  return (
    <div>
      <FadeIn type="fade-down" duration={500}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.company.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={Math.round(data.company.rating)} />
            <span className="text-gray-600 dark:text-gray-400">{data.company.rating}</span>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <FadeIn key={card.label} type="scale" duration={400} delay={100 + index * 80}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(card.value)}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn type="fade-up" duration={400} delay={200}>
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Recent Reviews
          </h3>
          {data.recentReviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentReviews.map((review, index) => (
                <FadeIn key={review.id} type="fade-up" duration={350} delay={250 + index * 100}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:border-green-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {review.user?.name}
                      </span>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
