import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterResidentPage } from '@/pages/auth/RegisterResidentPage';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(() => null),
    clearToken: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/register/resident']}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('RegisterResidentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the EcoColeta brand', () => {
    renderWithProviders(<RegisterResidentPage />);
    expect(screen.getByText('EcoColeta')).toBeInTheDocument();
  });

  it('renders the registration heading', () => {
    renderWithProviders(<RegisterResidentPage />);
    expect(screen.getByText('Cadastro')).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    renderWithProviders(<RegisterResidentPage />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderWithProviders(<RegisterResidentPage />);
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderWithProviders(<RegisterResidentPage />);
    expect(screen.getByText('Entrar')).toHaveAttribute('href', '/login');
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterResidentPage />);

    await user.type(screen.getByLabelText(/nome/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'john@test.com');
    await user.type(screen.getByLabelText(/^senha/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'password456');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(screen.getByText('Senhas não conferem')).toBeInTheDocument();
  });

  it('allows typing in all fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterResidentPage />);

    await user.type(screen.getByLabelText(/nome/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'john@test.com');
    await user.type(screen.getByLabelText(/^senha/i), 'pass123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'pass123');

    expect(screen.getByLabelText(/nome/i)).toHaveValue('John');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john@test.com');
  });
});
