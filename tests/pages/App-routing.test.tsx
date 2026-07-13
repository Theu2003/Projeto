import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/App';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

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

describe('App routing - redirect behavior', () => {
  it('redirects unauthenticated user from / to /login', () => {
    renderAppRoutes(['/']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /requests/new to /login', () => {
    renderAppRoutes(['/requests/new']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /history to /login', () => {
    renderAppRoutes(['/history']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /admin/users to /login', () => {
    renderAppRoutes(['/admin/users']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /map to /login', () => {
    renderAppRoutes(['/map']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('catch-all route redirects to /', () => {
    renderAppRoutes(['/nonexistent-page']);
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  it('allows access to /register/resident when not authenticated', () => {
    renderAppRoutes(['/register/resident']);
    expect(screen.getByText(/criar conta de morador/i)).toBeInTheDocument();
  });

  it('allows access to /register/company when not authenticated', () => {
    renderAppRoutes(['/register/company']);
    expect(screen.getByRole('heading', { name: /cadastrar empresa/i })).toBeInTheDocument();
  });
});
