import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RequestDetailPage } from '@/pages/resident/RequestDetailPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'João Silva', email: 'joao@test.com', role: 'resident' },
    isAuthenticated: true,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'req-1' }),
  };
});

const mockRequest = {
  id: 'req-1',
  materialType: 'plastic',
  quantityKg: 5.5,
  status: 'accepted',
  address: 'Rua das Flores, 123',
  createdAt: '2025-01-10T10:00:00Z',
  desiredDate: '2025-01-15',
  observations: 'Leave at the gate',
  company: { id: 'c1', name: 'EcoRecicla', rating: 4.5 },
  timeline: [
    { status: 'pending', timestamp: '2025-01-10T10:00:00Z' },
    { status: 'accepted', timestamp: '2025-01-11T08:00:00Z' },
  ],
};

describe('RequestDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
  });

  it('displays loading state initially', () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders request details after loading', async () => {
    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('plastic')).toBeInTheDocument();
    });
    expect(screen.getByText('5.5 kg')).toBeInTheDocument();
    expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument();
  });

  it('renders the timeline with correct steps', async () => {
    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Request Created')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Accepted').length).toBeGreaterThanOrEqual(1);
  });

  it('shows company info when request is accepted', async () => {
    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('EcoRecicla')).toBeInTheDocument();
    });
  });

  it('shows cancel button for pending/accepted requests', async () => {
    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('cancels the request and refreshes', async () => {
    const user = userEvent.setup();
    (apiClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
    (apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockRequest)
      .mockResolvedValueOnce({
        ...mockRequest,
        status: 'cancelled',
      });

    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/requests/req-1/cancel');
    });
  });

  it('shows review form for completed requests', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockRequest,
      status: 'completed',
    });

    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/leave a review/i)).toBeInTheDocument();
    });
  });

  it('submits a review', async () => {
    const user = userEvent.setup();
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockRequest,
      status: 'completed',
    });
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'rev-1' });

    render(
      <MemoryRouter>
        <RequestDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/leave a review/i)).toBeInTheDocument();
    });

    const stars = screen.getAllByRole('button', { name: /star/i });
    await user.click(stars[3]); // 4 stars
    await user.type(screen.getByLabelText(/comment/i), 'Great service!');
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/reviews', expect.objectContaining({
        requestId: 'req-1',
        rating: 4,
        comment: 'Great service!',
      }));
    });
  });
});
