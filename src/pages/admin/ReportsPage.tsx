import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { ReportsSkeleton } from '@/components/Skeleton';
import { MonthlyReport } from '@/types';

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function ReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<MonthlyReport[]>('/admin/reports')
      .then(setReports)
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ReportsSkeleton />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h2>
        <div className="space-x-2">
          <button className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
            Export PDF
          </button>
          <button className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
            Export Excel
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reports available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.month}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-3">
                {formatMonth(report.month)}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">New Users</span>
                  <span className="font-medium">{report.newUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">New Companies</span>
                  <span className="font-medium">{report.newCompanies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Completed Requests</span>
                  <span className="font-medium">{report.completedRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total Weight (kg)</span>
                  <span className="font-medium">{report.totalWeight.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
