import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/App';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(() => 'test-token'),
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

const renderAppRoutes = (initialEntries: string[]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('App routing', () => {
  it('renders login page at /login', () => {
    renderAppRoutes(['/login']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders register resident page at /register/resident', () => {
    renderAppRoutes(['/register/resident']);
    expect(screen.getByText(/criar conta de morador/i)).toBeInTheDocument();
  });

  it('renders register company page at /register/company', () => {
    renderAppRoutes(['/register/company']);
    expect(screen.getByRole('heading', { name: /cadastrar empresa/i })).toBeInTheDocument();
  });

  it('renders app layout at /', () => {
    renderAppRoutes(['/']);
    expect(screen.getByText('EcoColeta')).toBeInTheDocument();
  });
});
