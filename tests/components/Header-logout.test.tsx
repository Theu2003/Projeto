import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(() => 'test-token'),
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

describe('Header - logout', () => {
  it('has a logout button', () => {
    renderHeader();
    expect(screen.getByLabelText(/sair/i)).toBeInTheDocument();
  });
});
