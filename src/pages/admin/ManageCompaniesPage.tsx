import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Company } from '@/types';
import { DataTable, Column, DataTableAction } from '@/components/DataTable';
import { TableSkeleton } from '@/components/Skeleton';

export function ManageCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get<Company[]>('/admin/companies')
      .then(setCompanies)
      .catch(() => setError('Falha ao carregar empresas'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  async function approveCompany(companyId: string) {
    await apiClient.put(`/admin/companies/${companyId}/approve`);
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, approved: true } : c))
    );
  }

  async function toggleActive(companyId: string) {
    await apiClient.put(`/admin/companies/${companyId}/toggle-active`);
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, active: !c.active } : c))
    );
  }

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    { key: 'cnpj', header: 'CNPJ' },
    {
      key: 'approved',
      header: 'Aprovada',
      render: (row) => (
        <span className={row.approved ? 'text-green-600' : 'text-yellow-500'}>
          {row.approved ? 'Sim' : 'Não'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <span className={row.active ? 'text-green-600' : 'text-red-500'}>
          {row.active ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Avaliação',
      render: (row) => row.rating.toFixed(1),
    },
  ];

  const actions: DataTableAction<Company>[] = [
    {
      label: (row) => (row.approved ? null : 'Aprovar'),
      onClick: (row) => approveCompany(row.id),
    },
    {
      label: (row) => (row.active ? 'Bloquear' : 'Desbloquear'),
      onClick: (row) => toggleActive(row.id),
    },
  ];

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Gerenciar Empresas
      </h2>
      <DataTable
        columns={columns}
        data={companies}
        actions={actions}
        emptyMessage="Nenhuma empresa encontrada."
      />
    </div>
  );
}
