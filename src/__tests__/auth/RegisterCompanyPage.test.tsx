import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterCompanyPage } from '@/pages/auth/RegisterCompanyPage';
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
    <MemoryRouter initialEntries={['/register/company']}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('RegisterCompanyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the EcoColeta brand', () => {
    renderWithProviders(<RegisterCompanyPage />);
    expect(screen.getByText('EcoColeta')).toBeInTheDocument();
  });

  it('renders the company registration heading', () => {
    renderWithProviders(<RegisterCompanyPage />);
    expect(screen.getByRole('heading', { name: 'Cadastrar Empresa' })).toBeInTheDocument();
  });

  it('renders all company-specific form fields', () => {
    renderWithProviders(<RegisterCompanyPage />);
    expect(screen.getByLabelText(/nome da empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/responsável/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderWithProviders(<RegisterCompanyPage />);
    expect(screen.getByRole('button', { name: /cadastrar empresa/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderWithProviders(<RegisterCompanyPage />);
    expect(screen.getByText('Entrar')).toHaveAttribute('href', '/login');
  });

  it('allows typing in CNPJ field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterCompanyPage />);
    const cnpjInput = screen.getByLabelText(/cnpj/i);
    await user.type(cnpjInput, '12.345.678/0001-90');
    expect(cnpjInput).toHaveValue('12.345.678/0001-90');
  });

  it('allows typing in all fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterCompanyPage />);

    await user.type(screen.getByLabelText(/nome da empresa/i), 'EcoRecicla');
    await user.type(screen.getByLabelText(/email/i), 'eco@test.com');
    await user.type(screen.getByLabelText(/cnpj/i), '12.345.678/0001-90');
    await user.type(screen.getByLabelText(/responsável/i), 'Maria');
    await user.type(screen.getByLabelText(/telefone/i), '11999887766');
    await user.type(screen.getByLabelText(/endereço/i), 'Rua A, 123');
    await user.type(screen.getByLabelText(/senha/i), 'pass123');

    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('EcoRecicla');
    expect(screen.getByLabelText(/email/i)).toHaveValue('eco@test.com');
  });
});
