import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HistoryPage } from '@/pages/resident/HistoryPage';
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

const mockRequests = [
  { id: '1', materialType: 'paper', quantityKg: 5, status: 'completed', createdAt: '2026-01-01' },
  { id: '2', materialType: 'plastic', quantityKg: 3, status: 'pending', createdAt: '2026-01-02' },
  { id: '3', materialType: 'glass', quantityKg: 2, status: 'cancelled', createdAt: '2026-01-03' },
  { id: '4', materialType: 'paper', quantityKg: 1, status: 'completed', createdAt: '2026-01-04' },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/resident/history']}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

/** Count how many visible request cards contain the given material type text */
function countRequestCardsByText(text: string) {
  return screen.queryAllByText(text, { selector: 'p.font-medium' }).length;
}

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HistoryPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the page heading', async () => {
    mockGet.mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Request History')).toBeInTheDocument();
    });
  });

  it('displays all requests after loading', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      // paper appears twice in request cards (and in filter option)
      expect(countRequestCardsByText('paper')).toBe(2);
    });
    expect(countRequestCardsByText('plastic')).toBe(1);
    expect(countRequestCardsByText('glass')).toBe(1);
  });

  it('renders status filter dropdown', async () => {
    mockGet.mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    });
  });

  it('renders material filter dropdown', async () => {
    mockGet.mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/filter by material/i)).toBeInTheDocument();
    });
  });

  it('filters requests by status', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(countRequestCardsByText('plastic')).toBe(1);
    });

    const statusFilter = screen.getByLabelText(/filter by status/i);
    await userEvent.selectOptions(statusFilter, 'completed');

    // Only completed requests should remain in cards
    expect(countRequestCardsByText('paper')).toBe(2);
    expect(countRequestCardsByText('plastic')).toBe(0);
    expect(countRequestCardsByText('glass')).toBe(0);
  });

  it('filters requests by material', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(countRequestCardsByText('plastic')).toBe(1);
    });

    const materialFilter = screen.getByLabelText(/filter by material/i);
    await userEvent.selectOptions(materialFilter, 'paper');

    expect(countRequestCardsByText('paper')).toBe(2);
    expect(countRequestCardsByText('plastic')).toBe(0);
    expect(countRequestCardsByText('glass')).toBe(0);
  });

  it('combines status and material filters', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(countRequestCardsByText('plastic')).toBe(1);
    });

    await userEvent.selectOptions(screen.getByLabelText(/filter by status/i), 'completed');
    await userEvent.selectOptions(screen.getByLabelText(/filter by material/i), 'paper');

    expect(countRequestCardsByText('paper')).toBe(2);
    expect(countRequestCardsByText('plastic')).toBe(0);
    expect(countRequestCardsByText('glass')).toBe(0);
  });

  it('shows "No requests found" when filters match nothing', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(countRequestCardsByText('plastic')).toBe(1);
    });

    await userEvent.selectOptions(screen.getByLabelText(/filter by status/i), 'rescheduled');
    expect(screen.getByText('No requests found')).toBeInTheDocument();
  });

  it('links requests to their detail pages', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(countRequestCardsByText('paper')).toBe(2);
    });
    const links = screen.getAllByRole('link');
    const requestLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/resident/requests/'));
    expect(requestLinks.length).toBe(4);
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValue(new Error('Failed to load'));
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });

  it('shows "No requests found" when list is empty', async () => {
    mockGet.mockResolvedValue([]);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('No requests found')).toBeInTheDocument();
    });
  });

  it('populates material filter options from data', async () => {
    mockGet.mockResolvedValue(mockRequests);
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      const materialFilter = screen.getByLabelText(/filter by material/i);
      expect(materialFilter.querySelectorAll('option')).toHaveLength(4);
    });
  });
});
