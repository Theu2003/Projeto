import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionProcessPage } from '@/pages/company/CollectionProcessPage';
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

const mockAcceptedRequest = {
  id: 'req-1',
  userId: 'user-1',
  companyId: 'comp-1',
  status: 'accepted',
  materialType: 'Plástico',
  quantityKg: 3.0,
  observations: '',
  photos: [],
  desiredDate: '2026-07-15',
  desiredTime: '10:00',
  latitude: -23.55,
  longitude: -46.63,
  address: 'Rua das Flores, 123',
  createdAt: '2026-07-10T08:00:00Z',
  user: { id: 'user-1', name: 'Maria Silva' },
};

const mockOnTheWayRequest = {
  ...mockAcceptedRequest,
  status: 'on_the_way',
};

describe('CollectionProcessPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<CollectionProcessPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders collection flow for accepted request', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockAcceptedRequest);
    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Collection Process')).toBeInTheDocument();
    });

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Plástico')).toBeInTheDocument();
  });

  it('shows "Start Journey" button for accepted status', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockAcceptedRequest);
    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Start Journey')).toBeInTheDocument();
    });
  });

  it('shows "Complete Collection" button for on_the_way status', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockOnTheWayRequest);
    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete Collection')).toBeInTheDocument();
    });
  });

  it('shows weight input for completing collection', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockOnTheWayRequest);
    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/real weight/i)).toBeInTheDocument();
    });
  });

  it('calls on-the-way API when start journey is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockAcceptedRequest);
    vi.mocked(apiClient.put).mockResolvedValue(mockOnTheWayRequest);

    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Start Journey')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Start Journey'));

    expect(apiClient.put).toHaveBeenCalledWith('/requests/req-1/on-the-way');
  });

  it('calls complete API with real weight', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockOnTheWayRequest);
    vi.mocked(apiClient.put).mockResolvedValue({
      ...mockOnTheWayRequest,
      status: 'completed',
      realWeight: 3.2,
    });

    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete Collection')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const weightInput = screen.getByLabelText(/real weight/i);
    await user.clear(weightInput);
    await user.type(weightInput, '3.2');
    await user.click(screen.getByText('Complete Collection'));

    expect(apiClient.put).toHaveBeenCalledWith('/requests/req-1/complete', {
      realWeight: 3.2,
    });
  });

  it('does not call complete API without weight', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockOnTheWayRequest);

    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete Collection')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Complete Collection'));

    await waitFor(() => {
      expect(apiClient.put).not.toHaveBeenCalledWith(
        '/requests/req-1/complete',
        expect.anything()
      );
    });
  });

  it('shows success message after completing', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockOnTheWayRequest);
    vi.mocked(apiClient.put).mockResolvedValue({
      ...mockOnTheWayRequest,
      status: 'completed',
      realWeight: 3.2,
    });

    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete Collection')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const weightInput = screen.getByLabelText(/real weight/i);
    await user.type(weightInput, '3.2');
    await user.click(screen.getByText('Complete Collection'));

    await waitFor(() => {
      expect(screen.getByText('Collection completed successfully!')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));
    render(<CollectionProcessPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
