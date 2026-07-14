import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterResidentPage } from '@/pages/auth/RegisterResidentPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <RegisterResidentPage />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('RegisterResidentPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders registration form fields', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mínimo 6 caracteres/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/repita a senha/i)).toBeInTheDocument();
  });

  it('renders register button', () => {
    renderRegisterPage();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderRegisterPage();
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login');
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.type(screen.getByPlaceholderText(/repita a senha/i), 'different');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
    });
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'new-token',
        user: { id: '1', name: 'João', email: 'joao@email.com', role: 'resident', points: 0, active: true },
        company: null,
      }),
    } as Response);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome/i), 'João');
    await user.type(screen.getByLabelText(/cpf/i), '12345678901');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/email/i), 'joao@email.com');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.type(screen.getByPlaceholderText(/repita a senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/register/resident',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'João',
          cpf: '12345678901',
          phone: '11999998888',
          email: 'joao@email.com',
          password: 'password123',
        }),
      })
    );
  });

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email já cadastrado' }),
    } as Response);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome/i), 'João');
    await user.type(screen.getByLabelText(/cpf/i), '12345678901');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/email/i), 'existing@email.com');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.type(screen.getByPlaceholderText(/repita a senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText(/email já cadastrado/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void;
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome/i), 'João');
    await user.type(screen.getByLabelText(/cpf/i), '12345678901');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/email/i), 'joao@email.com');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.type(screen.getByPlaceholderText(/repita a senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /criar conta/i })).toBeDisabled();
    });

    resolveFetch!({
      ok: true,
      json: async () => ({ token: 't', user: { id: '1', name: 'J', email: 'j@j.com', role: 'resident', points: 0, active: true }, company: null }),
    } as Response);
  });
});
