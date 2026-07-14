import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResidentDashboard } from '@/pages/resident/ResidentDashboard';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'João Silva', email: 'joao@test.com', role: 'resident', points: 150, active: true },
    isAuthenticated: true,
  }),
}));

const mockDashboardData = {
  totalRequests: 12,
  completedRequests: 8,
  pendingRequests: 2,
  points: 150,
};

const mockRecentRequests = [
  {
    id: '1',
    materialType: 'plastic',
    quantityKg: 5.5,
    status: 'completed',
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: '2',
    materialType: 'paper',
    quantityKg: 3.0,
    status: 'pending',
    createdAt: '2025-01-12T14:00:00Z',
  },
];

describe('ResidentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <ResidentDashboard />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });

  it('renders dashboard stats after loading', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockDashboardData)
      .mockResolvedValueOnce(mockRecentRequests);

    render(
      <MemoryRouter>
        <ResidentDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  it('renders recent requests list', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockDashboardData)
      .mockResolvedValueOnce(mockRecentRequests);

    render(
      <MemoryRouter>
        <ResidentDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('plastic')).toBeInTheDocument();
    });
    expect(screen.getByText('paper')).toBeInTheDocument();
  });

  it('displays error state on API failure', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <ResidentDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
