import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(() => null),
    get: vi.fn(),
  },
}));

vi.mock('@/services/socket', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
  disconnectSocket: vi.fn(),
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    socket: null,
  }),
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    markAsRead: vi.fn(),
  }),
}));

const renderLayout = (role: 'resident' | 'company' | 'admin' = 'resident') => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout role={role} userName="Test User" />}>
              <Route path="/" element={<div data-testid="page-content">Page Content</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Layout - sidebar toggle', () => {
  it('displays resident links when role is resident', () => {
    renderLayout('resident');
    expect(screen.getByText('Nova Solicitação')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
  });

  it('displays company links when role is company', () => {
    renderLayout('company');
    expect(screen.getByText('Mapa')).toBeInTheDocument();
    expect(screen.getByText('Solicitações')).toBeInTheDocument();
    expect(screen.getByText('Processar Coleta')).toBeInTheDocument();
  });

  it('displays admin links when role is admin', () => {
    renderLayout('admin');
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('shows logout button in the header', () => {
    renderLayout();
    expect(screen.getByLabelText(/sair/i)).toBeInTheDocument();
  });

  it('shows theme toggle in the header', () => {
    renderLayout();
    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
  });
});
