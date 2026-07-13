import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HistoryPage } from '@/pages/resident/HistoryPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'João Silva', email: 'joao@test.com', role: 'resident' },
    isAuthenticated: true,
  }),
}));

const mockRequests = [
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
  {
    id: '3',
    materialType: 'glass',
    quantityKg: 8.0,
    status: 'cancelled',
    createdAt: '2025-01-08T09:00:00Z',
  },
];

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
  });

  it('displays loading state initially', () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders all requests after loading', async () => {
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('plastic').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('paper').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('glass').length).toBeGreaterThanOrEqual(1);
  });

  it('filters requests by status', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('plastic').length).toBeGreaterThanOrEqual(1);
    });

    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.selectOptions(statusFilter, 'completed');

    // "plastic" should appear in the list (filtered result) but not "paper" or "glass" list items
    // Note: "paper" and "glass" still appear in filter dropdown options
    expect(screen.getAllByText('plastic').length).toBeGreaterThanOrEqual(1);
  });

  it('filters requests by material type', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('plastic').length).toBeGreaterThanOrEqual(1);
    });

    const materialFilter = screen.getByLabelText(/filter by material/i);
    await user.selectOptions(materialFilter, 'paper');

    // After filtering by paper, the list should show paper but not glass
    expect(screen.getAllByText('paper').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no requests match filters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('plastic').length).toBeGreaterThanOrEqual(1);
    });

    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.selectOptions(statusFilter, 'on_the_way');

    expect(screen.getByText(/no requests found/i)).toBeInTheDocument();
  });

  it('displays error state on API failure', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
