import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Company } from '@/types';
import { DataTable, Column, DataTableAction } from '@/components/DataTable';

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
      .catch(() => setError('Failed to load companies'))
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
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'cnpj', header: 'CNPJ' },
    {
      key: 'approved',
      header: 'Approved',
      render: (row) => (
        <span className={row.approved ? 'text-green-600' : 'text-yellow-500'}>
          {row.approved ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <span className={row.active ? 'text-green-600' : 'text-red-500'}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => row.rating.toFixed(1),
    },
  ];

  const actions: DataTableAction<Company>[] = [
    {
      label: (row) => (row.approved ? null : 'Approve'),
      onClick: (row) => approveCompany(row.id),
    },
    {
      label: (row) => (row.active ? 'Block' : 'Unblock'),
      onClick: (row) => toggleActive(row.id),
    },
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Manage Companies
      </h2>
      <DataTable
        columns={columns}
        data={companies}
        actions={actions}
        emptyMessage="No companies found."
      />
    </div>
  );
}
