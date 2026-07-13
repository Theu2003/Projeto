import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ManageUsersPage } from '@/pages/admin/ManageUsersPage';
import { ManageCompaniesPage } from '@/pages/admin/ManageCompaniesPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from '@/services/api';

const mockGet = vi.mocked(apiClient.get);
const mockPut = vi.mocked(apiClient.put);

const mockStats = {
  totalUsers: 150,
  activeUsers: 120,
  totalCompanies: 25,
  approvedCompanies: 20,
  totalRequests: 500,
  completedRequests: 400,
  pendingRequests: 50,
  totalPoints: 12000,
};

const mockUsers = [
  { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'resident' as const, points: 500, active: true },
  { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'resident' as const, points: 100, active: false },
];

const mockCompanies = [
  { id: 'c1', name: 'EcoRecicle', email: 'eco@test.com', cnpj: '123456789', responsible: 'Joao', phone: '1199999', address: 'Rua A', latitude: -23.5, longitude: -46.6, serviceAreaRadius: 10, materials: ['plastic'], approved: true, active: true, rating: 4.5 },
  { id: 'c2', name: 'VerdeVida', email: 'verde@test.com', cnpj: '987654321', responsible: 'Maria', phone: '1188888', address: 'Rua B', latitude: -23.6, longitude: -46.7, serviceAreaRadius: 15, materials: ['paper'], approved: false, active: true, rating: 0 },
];

const mockReports = [
  { month: '2026-01', newUsers: 30, newCompanies: 5, completedRequests: 80, totalWeight: 2500 },
  { month: '2026-02', newUsers: 25, newCompanies: 3, completedRequests: 95, totalWeight: 3100 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminDashboard', () => {
  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays platform statistics after loading', async () => {
    mockGet.mockResolvedValue(mockStats);
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Platform Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Completed Requests')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load platform statistics')).toBeInTheDocument();
    });
  });

  it('fetches stats from correct endpoint', async () => {
    mockGet.mockResolvedValue(mockStats);
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/stats');
    });
  });
});

describe('ManageUsersPage', () => {
  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ManageUsersPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays users after loading', async () => {
    mockGet.mockResolvedValue(mockUsers);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('shows empty message when no users', async () => {
    mockGet.mockResolvedValue([]);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });
  });

  it('toggles user active status on block/activate click', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(mockUsers);
    mockPut.mockResolvedValue({});

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Alice is active, should show "Block" button
    const blockButtons = screen.getAllByText('Block');
    expect(blockButtons.length).toBeGreaterThanOrEqual(1);

    await user.click(blockButtons[0]);
    expect(mockPut).toHaveBeenCalledWith('/admin/users/u1/toggle-active');
  });

  it('fetches users from correct endpoint', async () => {
    mockGet.mockResolvedValue(mockUsers);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/users');
    });
  });
});

describe('ManageCompaniesPage', () => {
  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ManageCompaniesPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays companies after loading', async () => {
    mockGet.mockResolvedValue(mockCompanies);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Companies')).toBeInTheDocument();
    });

    expect(screen.getByText('EcoRecicle')).toBeInTheDocument();
    expect(screen.getByText('VerdeVida')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load companies')).toBeInTheDocument();
    });
  });

  it('shows empty message when no companies', async () => {
    mockGet.mockResolvedValue([]);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('No companies found.')).toBeInTheDocument();
    });
  });

  it('shows approve button for unapproved company', async () => {
    mockGet.mockResolvedValue(mockCompanies);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('EcoRecicle')).toBeInTheDocument();
    });

    expect(screen.getByText('Approve')).toBeInTheDocument();
  });

  it('approves company when approve button clicked', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(mockCompanies);
    mockPut.mockResolvedValue({});

    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('EcoRecicle')).toBeInTheDocument();
    });

    const approveButton = screen.getByText('Approve');
    await user.click(approveButton);
    expect(mockPut).toHaveBeenCalledWith('/admin/companies/c2/approve');
  });

  it('blocks active company', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(mockCompanies);
    mockPut.mockResolvedValue({});

    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('EcoRecicle')).toBeInTheDocument();
    });

    const blockButtons = screen.getAllByText('Block');
    await user.click(blockButtons[0]);
    expect(mockPut).toHaveBeenCalledWith('/admin/companies/c1/toggle-active');
  });

  it('fetches companies from correct endpoint', async () => {
    mockGet.mockResolvedValue(mockCompanies);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/companies');
    });
  });
});

describe('ReportsPage', () => {
  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ReportsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays reports after loading', async () => {
    mockGet.mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    expect(screen.getByText('January 2026')).toBeInTheDocument();
    expect(screen.getByText('February 2026')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    // toLocaleString formatting varies by runtime locale; match any formatted version
    expect(screen.getByText((_, element) => element?.textContent?.replace(/[,.\s]/g, '') === '2500')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
    });
  });

  it('shows empty message when no reports', async () => {
    mockGet.mockResolvedValue([]);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('No reports available.')).toBeInTheDocument();
    });
  });

  it('renders export buttons', async () => {
    mockGet.mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
      expect(screen.getByText('Export Excel')).toBeInTheDocument();
    });
  });

  it('fetches reports from correct endpoint', async () => {
    mockGet.mockResolvedValue(mockReports);
    render(<ReportsPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/reports');
    });
  });
});
