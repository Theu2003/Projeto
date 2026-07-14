import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { FadeIn } from '@/components/FadeIn';
import { DashboardSkeleton } from '@/components/Skeleton';
import { AdminStats } from '@/types';

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(() => setError('Falha ao carregar estatísticas da plataforma'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardSkeleton type="admin" />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Usuários', value: stats.totalUsers },
    { label: 'Usuários Ativos', value: stats.activeUsers },
    { label: 'Total Empresas', value: stats.totalCompanies },
    { label: 'Empresas Aprovadas', value: stats.approvedCompanies },
    { label: 'Total Solicitações', value: stats.totalRequests },
    { label: 'Solicitações Concluídas', value: stats.completedRequests },
    { label: 'Solicitações Pendentes', value: stats.pendingRequests },
    { label: 'Total Pontos', value: stats.totalPoints },
  ];

  return (
    <div>
      <FadeIn type="fade-down" duration={500}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Estatísticas da Plataforma
        </h2>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <FadeIn key={card.label} type="scale" duration={400} delay={index * 80}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(card.value)}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
