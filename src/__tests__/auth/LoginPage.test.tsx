import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API client to avoid real network calls
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
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the EcoColeta brand name', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('EcoColeta')).toBeInTheDocument();
  });

  it('renders the login heading', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('renders email and password input fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders link to resident registration', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Criar conta de morador')).toHaveAttribute('href', '/register/resident');
  });

  it('renders link to company registration', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Cadastrar empresa')).toHaveAttribute('href', '/register/company');
  });

  it('allows typing in email field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('allows typing in password field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    const passwordInput = screen.getByLabelText(/senha/i);
    await user.type(passwordInput, 'secret123');
    expect(passwordInput).toHaveValue('secret123');
  });
});
