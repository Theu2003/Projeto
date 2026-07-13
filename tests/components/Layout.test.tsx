import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('Layout', () => {
  it('renders the sidebar and header', () => {
    renderLayout();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getAllByText('EcoColeta').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the header with user name', () => {
    renderLayout();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders child content in the outlet', () => {
    renderLayout();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders sidebar with role-appropriate links', () => {
    renderLayout('admin');
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('toggles sidebar visibility when menu button is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderLayout();

    const menuButton = screen.getByLabelText(/toggle menu/i);
    const sidebar = screen.getByRole('navigation');

    expect(sidebar).toBeInTheDocument();
    await user.click(menuButton);
    expect(sidebar).toBeInTheDocument();
  });

  it('shows notification bell in the header', () => {
    renderLayout();
    expect(screen.getByLabelText(/notificações/i)).toBeInTheDocument();
  });
});
