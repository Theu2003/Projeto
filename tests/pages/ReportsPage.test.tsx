import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockReports = [
  { month: '2025-01', newUsers: 20, newCompanies: 3, completedRequests: 45, totalWeight: 1200 },
  { month: '2025-02', newUsers: 35, newCompanies: 5, completedRequests: 60, totalWeight: 1800 },
  { month: '2025-03', newUsers: 28, newCompanies: 2, completedRequests: 50, totalWeight: 1500 },
];

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<ReportsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders report page title after data loads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
  });

  it('renders monthly report data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('January 2025')).toBeInTheDocument();
    });

    expect(screen.getByText('February 2025')).toBeInTheDocument();
    expect(screen.getByText('March 2025')).toBeInTheDocument();
  });

  it('shows PDF export button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
  });

  it('shows Excel export button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Export Excel')).toBeInTheDocument();
    });
  });

  it('calls API to fetch report data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/admin/reports');
    });
  });

  it('shows error message on load failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
