import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(() => null),
    get: vi.fn(),
  },
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    markAsRead: vi.fn(),
  }),
}));

const renderHeader = (userName = 'Test User', onMenuToggle = vi.fn()) => {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <Header userName={userName} onMenuToggle={onMenuToggle} />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Header', () => {
  it('renders the EcoColeta brand', () => {
    renderHeader();
    expect(screen.getByText('EcoColeta')).toBeInTheDocument();
  });

  it('displays the user name', () => {
    renderHeader('João Silva');
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('has a menu toggle button', () => {
    renderHeader();
    expect(screen.getByLabelText(/toggle menu/i)).toBeInTheDocument();
  });

  it('calls onMenuToggle when menu button is clicked', async () => {
    const onMenuToggle = vi.fn();
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderHeader('Test', onMenuToggle);

    await user.click(screen.getByLabelText(/toggle menu/i));
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('has a theme toggle button', () => {
    renderHeader();
    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
  });

  it('renders notification bell', () => {
    renderHeader();
    expect(screen.getByLabelText(/notificações/i)).toBeInTheDocument();
  });

  it('has a logout button', () => {
    renderHeader();
    expect(screen.getByLabelText(/sair/i)).toBeInTheDocument();
  });
});
