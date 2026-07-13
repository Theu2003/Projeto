import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterCompanyPage } from '@/pages/auth/RegisterCompanyPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <RegisterCompanyPage />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('RegisterCompanyPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders company registration form fields', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/nome da empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/responsável/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mínimo 6 caracteres/i)).toBeInTheDocument();
  });

  it('renders register button', () => {
    renderRegisterPage();
    expect(screen.getByRole('button', { name: /cadastrar empresa/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderRegisterPage();
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login');
  });

  it('submits form with company data', async () => {
    const user = userEvent.setup();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'company-token',
        user: { id: '2', name: 'EcoRecicla', email: 'eco@recicla.com', role: 'company', cnpj: '12.345.678/0001-90', active: true, approved: false },
      }),
    } as Response);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome da empresa/i), 'EcoRecicla');
    await user.type(screen.getByLabelText(/email/i), 'eco@recicla.com');
    await user.type(screen.getByLabelText(/cnpj/i), '12.345.678/0001-90');
    await user.type(screen.getByLabelText(/responsável/i), 'Carlos');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/endereço/i), 'Rua Verde, 123');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.click(screen.getByRole('button', { name: /cadastrar empresa/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/register/company',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('shows error on registration failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'CNPJ já cadastrado' }),
    } as Response);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome da empresa/i), 'EcoRecicla');
    await user.type(screen.getByLabelText(/email/i), 'eco@recicla.com');
    await user.type(screen.getByLabelText(/cnpj/i), '12.345.678/0001-90');
    await user.type(screen.getByLabelText(/responsável/i), 'Carlos');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/endereço/i), 'Rua Verde, 123');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.click(screen.getByRole('button', { name: /cadastrar empresa/i }));

    await waitFor(() => {
      expect(screen.getByText(/cnpj já cadastrado/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void;
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome da empresa/i), 'EcoRecicla');
    await user.type(screen.getByLabelText(/email/i), 'eco@recicla.com');
    await user.type(screen.getByLabelText(/cnpj/i), '12.345.678/0001-90');
    await user.type(screen.getByLabelText(/responsável/i), 'Carlos');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/endereço/i), 'Rua Verde, 123');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.click(screen.getByRole('button', { name: /cadastrar empresa/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cadastrar empresa/i })).toBeDisabled();
    });

    resolveFetch!({
      ok: true,
      json: async () => ({ token: 't', user: { id: '2', name: 'E', email: 'e@e.com', role: 'company', active: true, approved: false } }),
    } as Response);
  });
});
