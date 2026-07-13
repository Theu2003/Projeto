import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapViewPage } from '@/pages/company/MapViewPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/components/MapView', () => ({
  MapView: ({ markers }: { markers: Array<{ id: string; title: string; status: string }> }) => (
    <div data-testid="map-view">
      {markers.map((m) => (
        <div key={m.id} data-testid={`marker-${m.id}`}>
          {m.title} - {m.status}
        </div>
      ))}
    </div>
  ),
}));

const mockRequests = [
  {
    id: 'req-1',
    userId: 'user-1',
    companyId: null,
    status: 'pending',
    materialType: 'Plástico',
    quantityKg: 3.0,
    latitude: -23.55,
    longitude: -46.63,
    address: 'Rua A, 123',
    desiredDate: '2026-07-15',
    desiredTime: '10:00',
    createdAt: '2026-07-10T08:00:00Z',
    user: { id: 'user-1', name: 'Maria Silva' },
  },
  {
    id: 'req-2',
    userId: 'user-2',
    companyId: null,
    status: 'pending',
    materialType: 'Papel',
    quantityKg: 5.0,
    latitude: -23.56,
    longitude: -46.64,
    address: 'Av. Brasil, 456',
    desiredDate: '2026-07-16',
    desiredTime: '14:00',
    createdAt: '2026-07-10T09:00:00Z',
    user: { id: 'user-2', name: 'João Santos' },
  },
];

describe('MapViewPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<MapViewPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders map with pending requests', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequests);
    render(<MapViewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('marker-req-1')).toHaveTextContent('Plástico');
    expect(screen.getByTestId('marker-req-2')).toHaveTextContent('Papel');
  });

  it('shows request count', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequests);
    render(<MapViewPage />);

    await waitFor(() => {
      expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no pending requests', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);
    render(<MapViewPage />);

    await waitFor(() => {
      expect(screen.getByText(/no pending requests/i)).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<MapViewPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('has a refresh button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockRequests);
    render(<MapViewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
