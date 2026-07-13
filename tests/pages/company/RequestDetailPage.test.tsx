import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestDetailPage } from '@/pages/company/RequestDetailPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'req-1' }),
  useNavigate: () => vi.fn(),
}));

const mockRequest = {
  id: 'req-1',
  userId: 'user-1',
  companyId: null,
  status: 'pending',
  materialType: 'Plástico',
  quantityKg: 3.0,
  observations: 'Caixas grandes',
  photos: [],
  desiredDate: '2026-07-15',
  desiredTime: '10:00',
  latitude: -23.55,
  longitude: -46.63,
  address: 'Rua das Flores, 123',
  createdAt: '2026-07-10T08:00:00Z',
  user: { id: 'user-1', name: 'Maria Silva', phone: '(11) 98888-8888' },
};

describe('RequestDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<RequestDetailPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders request details after load', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequest);
    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Plástico')).toBeInTheDocument();
    expect(screen.getByText(/3.*kg/)).toBeInTheDocument();
    expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument();
    expect(screen.getByText('Caixas grandes')).toBeInTheDocument();
  });

  it('shows accept and reject buttons for pending requests', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequest);
    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('calls accept API when accept button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequest);
    vi.mocked(apiClient.put).mockResolvedValue({ ...mockRequest, status: 'accepted' });

    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Accept'));

    expect(apiClient.put).toHaveBeenCalledWith('/requests/req-1/accept');
  });

  it('calls reject API when reject button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequest);
    vi.mocked(apiClient.put).mockResolvedValue({ ...mockRequest, status: 'cancelled' });

    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Reject'));

    expect(apiClient.put).toHaveBeenCalledWith('/requests/req-1/reject');
  });

  it('shows correct status badge', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequest);
    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });

    expect(screen.getByText(/pending/)).toBeInTheDocument();
  });

  it('hides action buttons for non-pending requests', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      ...mockRequest,
      status: 'completed',
    });
    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));
    render(<RequestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
