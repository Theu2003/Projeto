import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NewRequestPage } from '@/pages/resident/NewRequestPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'João Silva', email: 'joao@test.com', role: 'resident' },
    isAuthenticated: true,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockMaterials = [
  { id: '1', name: 'Plastic', icon: '♻️', category: 'recyclable', recyclable: true, pointsPerKg: 10 },
  { id: '2', name: 'Paper', icon: '📄', category: 'recyclable', recyclable: true, pointsPerKg: 5 },
];

describe('NewRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockMaterials);
  });

  it('renders the form with all fields', async () => {
    render(
      <MemoryRouter>
        <NewRequestPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desired date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/observations/i)).toBeInTheDocument();
  });

  it('loads materials into the select dropdown', async () => {
    render(
      <MemoryRouter>
        <NewRequestPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const select = screen.getByLabelText(/material/i);
      expect(select).toBeInTheDocument();
    });
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(3); // placeholder + 2 materials
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NewRequestPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/material is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/quantity is required/i)).toBeInTheDocument();
  });

  it('submits the form and navigates on success', async () => {
    const user = userEvent.setup();
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'new-1' });

    render(
      <MemoryRouter>
        <NewRequestPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/material/i), 'plastic');
    await user.type(screen.getByLabelText(/quantity/i), '5');
    await user.type(screen.getByLabelText(/desired date/i), '2025-02-01');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/requests', expect.objectContaining({
        materialType: 'plastic',
        quantityKg: 5,
      }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/resident/requests/new-1');
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to create'));

    render(
      <MemoryRouter>
        <NewRequestPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/material/i), 'plastic');
    await user.type(screen.getByLabelText(/quantity/i), '5');
    await user.type(screen.getByLabelText(/desired date/i), '2025-02-01');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
    });
  });
});
