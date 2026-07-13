import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResidentDashboard } from '@/pages/resident/ResidentDashboard';
import { AuthProvider } from '@/contexts/AuthContext';

const mockGet = vi.fn();

vi.mock('@/services/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
    put: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(() => 'mock-token'),
    clearToken: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/resident']}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('ResidentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<ResidentDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard stats after loading', async () => {
    mockGet
      .mockResolvedValueOnce({ totalRequests: 12, completedRequests: 8, points: 320 })
      .mockResolvedValueOnce([]);
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
  });

  it('displays stat labels', async () => {
    mockGet
      .mockResolvedValueOnce({ totalRequests: 5, completedRequests: 3, points: 100 })
      .mockResolvedValueOnce([]);
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  it('renders recent requests list', async () => {
    mockGet
      .mockResolvedValueOnce({ totalRequests: 2, completedRequests: 1, points: 50 })
      .mockResolvedValueOnce([
        { id: '1', materialType: 'paper', quantityKg: 5, status: 'completed', createdAt: '2026-01-01' },
        { id: '2', materialType: 'plastic', quantityKg: 3, status: 'pending', createdAt: '2026-01-02' },
      ]);
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      expect(screen.getByText('paper')).toBeInTheDocument();
    });
    expect(screen.getByText('plastic')).toBeInTheDocument();
  });

  it('renders "No requests yet" when list is empty', async () => {
    mockGet
      .mockResolvedValueOnce({ totalRequests: 0, completedRequests: 0, points: 0 })
      .mockResolvedValueOnce([]);
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      expect(screen.getByText('No requests yet')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('links new requests to the creation page', async () => {
    mockGet
      .mockResolvedValueOnce({ totalRequests: 0, completedRequests: 0, points: 0 })
      .mockResolvedValueOnce([]);
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      const link = screen.getByText('+ New Request');
      expect(link).toHaveAttribute('href', '/resident/requests/new');
    });
  });

  it('links each request to its detail page', async () => {
    mockGet
      .mockResolvedValueOnce({ totalRequests: 1, completedRequests: 0, points: 0 })
      .mockResolvedValueOnce([
        { id: 'req-42', materialType: 'glass', quantityKg: 2, status: 'pending', createdAt: '2026-01-01' },
      ]);
    renderWithProviders(<ResidentDashboard />);
    await waitFor(() => {
      const link = screen.getByText('glass').closest('a');
      expect(link).toHaveAttribute('href', '/resident/requests/req-42');
    });
  });
});
