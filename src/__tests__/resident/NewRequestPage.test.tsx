import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NewRequestPage } from '@/pages/resident/NewRequestPage';
import { AuthProvider } from '@/contexts/AuthContext';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(() => 'mock-token'),
    clearToken: vi.fn(),
  },
}));

const mockMaterials = [
  { id: '1', name: 'Paper', icon: '📄', category: 'Paper', recyclable: true, pointsPerKg: 10 },
  { id: '2', name: 'Plastic', icon: '♻️', category: 'Plastic', recyclable: true, pointsPerKg: 15 },
];

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/resident/requests/new']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('NewRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: materials loaded from API
    mockGet.mockResolvedValue(mockMaterials);
  });

  it('renders the page heading', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByText('New Collection Request')).toBeInTheDocument();
    });
  });

  it('renders the material select', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
    });
  });

  it('renders quantity input', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    });
  });

  it('renders date input', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });
  });

  it('renders observations textarea', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/special instructions/i)).toBeInTheDocument();
    });
  });

  it('renders submit button', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    });
  });

  it('shows validation error when material is not selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    expect(screen.getByText('Material is required')).toBeInTheDocument();
  });

  it('shows validation error when quantity is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    expect(screen.getByText('Quantity is required')).toBeInTheDocument();
  });

  it('submits the form and navigates on success', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({ id: 'new-req-1' });

    renderWithProviders(<NewRequestPage />);

    await waitFor(() => {
      expect(screen.getByText('📄 Paper')).toBeInTheDocument();
    });

    // The option values are m.name.toLowerCase() = "paper"
    await user.selectOptions(screen.getByLabelText(/material/i), 'paper');
    await user.type(screen.getByLabelText(/quantity/i), '5');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/requests', expect.objectContaining({
        materialType: 'paper',
        quantityKg: 5,
      }));
    });
  });

  it('displays error message on submit failure', async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(new Error('Server error'));

    renderWithProviders(<NewRequestPage />);

    await waitFor(() => {
      expect(screen.getByText('♻️ Plastic')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/material/i), 'plastic');
    await user.type(screen.getByLabelText(/quantity/i), '2');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('loads materials from API', async () => {
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByText('📄 Paper')).toBeInTheDocument();
    });
    expect(screen.getByText('♻️ Plastic')).toBeInTheDocument();
  });

  it('allows typing observations', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewRequestPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/special instructions/i)).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText(/special instructions/i);
    await user.type(textarea, 'Please ring the bell');
    expect(textarea).toHaveValue('Please ring the bell');
  });
});
