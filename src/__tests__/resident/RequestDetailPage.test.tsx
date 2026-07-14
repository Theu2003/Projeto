import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequestDetailPage } from '@/pages/resident/RequestDetailPage';
import { AuthProvider } from '@/contexts/AuthContext';

const mockGet = vi.fn();
const mockPut = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
    post: (...args: unknown[]) => mockPost(...args),
    setToken: vi.fn(),
    getToken: vi.fn(() => 'mock-token'),
    clearToken: vi.fn(),
  },
}));

const mockRequest = {
  id: 'req-1',
  userId: 'user-1',
  companyId: 'company-1',
  status: 'pending',
  materialType: 'paper',
  quantityKg: 5,
  observations: 'Big boxes',
  address: '123 Main St',
  createdAt: '2026-07-01T10:00:00Z',
  company: { id: 'company-1', name: 'EcoRecycle', rating: 4.5 },
};

const completedRequest = {
  ...mockRequest,
  status: 'completed',
  completedAt: '2026-07-10T14:00:00Z',
};

function renderWithProviders(ui: React.ReactElement, route = '/resident/requests/req-1') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/resident/requests/:id" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RequestDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('shows loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<RequestDetailPage />);
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });

  it('displays request details after loading', async () => {
    mockGet.mockResolvedValue(mockRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('paper')).toBeInTheDocument();
    });
    expect(screen.getByText(/5 kg/)).toBeInTheDocument();
    expect(screen.getByText('Big boxes')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('displays status badge', async () => {
    mockGet.mockResolvedValue(mockRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('displays company info when assigned', async () => {
    mockGet.mockResolvedValue(mockRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('EcoRecycle')).toBeInTheDocument();
    });
    expect(screen.getByText(/4\.5\/5/)).toBeInTheDocument();
  });

  it('renders timeline with correct steps for pending status', async () => {
    mockGet.mockResolvedValue(mockRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Request Created')).toBeInTheDocument();
    });
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('On the Way')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows cancel button for pending requests', async () => {
    mockGet.mockResolvedValue(mockRequest);
    mockPut.mockResolvedValue({});
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument();
    });
  });

  it('calls cancel API when cancel button is clicked', async () => {
    mockGet
      .mockResolvedValueOnce(mockRequest)
      .mockResolvedValueOnce({ ...mockRequest, status: 'cancelled' });
    mockPut.mockResolvedValue({});

    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /cancel request/i }));
    expect(mockPut).toHaveBeenCalledWith('/requests/req-1/cancel');
  });

  it('does not show cancel button for completed requests', async () => {
    mockGet.mockResolvedValue(completedRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('paper')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /cancel request/i })).not.toBeInTheDocument();
  });

  it('shows review form for completed requests', async () => {
    mockGet.mockResolvedValue(completedRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Leave a Review')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  it('does not show review form for pending requests', async () => {
    mockGet.mockResolvedValue(mockRequest);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('paper')).toBeInTheDocument();
    });
    expect(screen.queryByText('Leave a Review')).not.toBeInTheDocument();
  });

  it('submits review with rating and comment', async () => {
    mockGet.mockResolvedValue(completedRequest);
    mockPost.mockResolvedValue({});
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Leave a Review')).toBeInTheDocument();
    });

    const stars = screen.getAllByRole('button');
    const fourthStar = stars.find((s) => s.getAttribute('aria-label') === 'Star 4');
    await userEvent.click(fourthStar!);

    await userEvent.type(screen.getByPlaceholderText(/share your experience/i), 'Great service!');
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/reviews', expect.objectContaining({
        requestId: 'req-1',
        rating: 4,
        comment: 'Great service!',
      }));
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/Not found/)).toBeInTheDocument();
    });
  });

  it('shows "Request not found" when data is null', async () => {
    mockGet.mockResolvedValue(null);
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Request not found')).toBeInTheDocument();
    });
  });

  it('renders cancelled status timeline correctly', async () => {
    mockGet.mockResolvedValue({ ...mockRequest, status: 'cancelled' });
    renderWithProviders(<RequestDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Request Created')).toBeInTheDocument();
    });
    // "Cancelled" appears in both StatusBadge and Timeline
    const cancelledElements = screen.getAllByText('Cancelled');
    expect(cancelledElements.length).toBe(2);
  });
});
