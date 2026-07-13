import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockStats = {
  totalUsers: 150,
  activeUsers: 120,
  totalCompanies: 25,
  approvedCompanies: 20,
  totalRequests: 340,
  completedRequests: 280,
  pendingRequests: 15,
  totalPoints: 12500,
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders platform stats after data loads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockStats);
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Platform Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('280')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });

  it('renders stat labels', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockStats);
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('Approved Companies')).toBeInTheDocument();
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('Completed Requests')).toBeInTheDocument();
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();
    expect(screen.getByText('Total Points')).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
