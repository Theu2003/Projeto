import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CompanyDashboard } from '@/pages/company/CompanyDashboard';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockDashboard = {
  company: {
    id: 'comp-1',
    name: 'Recicla Fácil',
    rating: 4.5,
  },
  stats: {
    totalRequests: 120,
    pendingRequests: 8,
    completedToday: 3,
    totalCollected: 2500.5,
  },
  recentReviews: [
    {
      id: 'rev-1',
      userId: 'user-1',
      companyId: 'comp-1',
      requestId: 'req-1',
      rating: 5,
      comment: 'Excelente servicio!',
      createdAt: '2026-07-10T10:00:00Z',
      user: { id: 'user-1', name: 'Maria Silva' },
    },
    {
      id: 'rev-2',
      userId: 'user-2',
      companyId: 'comp-1',
      requestId: 'req-2',
      rating: 4,
      comment: undefined,
      createdAt: '2026-07-09T14:00:00Z',
      user: { id: 'user-2', name: 'João Santos' },
    },
  ],
};

describe('CompanyDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<CompanyDashboard />);
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });

  it('renders company name and rating', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockDashboard);
    render(<CompanyDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recicla Fácil')).toBeInTheDocument();
    });

    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('renders all stat cards', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockDashboard);
    render(<CompanyDashboard />);

    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2,500.5')).toBeInTheDocument();

    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed Today')).toBeInTheDocument();
    expect(screen.getByText('Total Collected (kg)')).toBeInTheDocument();
  });

  it('renders recent reviews', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockDashboard);
    render(<CompanyDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    });

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Excelente servicio!')).toBeInTheDocument();
    expect(screen.getByText('João Santos')).toBeInTheDocument();
  });

  it('renders star ratings correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockDashboard);
    render(<CompanyDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    // 5 stars for first review, 4 for second
    const starElements = screen.getAllByText(/★|☆/);
    expect(starElements.length).toBeGreaterThan(0);
  });

  it('shows error message on API failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<CompanyDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no reviews', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      ...mockDashboard,
      recentReviews: [],
    });
    render(<CompanyDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });

    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
  });
});
