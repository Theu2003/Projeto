import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { User } from '@/types';
import { DataTable, Column, DataTableAction } from '@/components/DataTable';

export function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get<User[]>('/admin/users')
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function toggleActive(userId: string) {
    await apiClient.put(`/admin/users/${userId}/toggle-active`);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
    );
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className="capitalize">{row.role}</span>
      ),
    },
    {
      key: 'points',
      header: 'Points',
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
  ];

  const actions: DataTableAction<User>[] = [
    {
      label: (row) => (row.active ? 'Block' : 'Activate'),
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
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Manage Users</h2>
      <DataTable columns={columns} data={users} actions={actions} emptyMessage="No users found." />
    </div>
  );
}
