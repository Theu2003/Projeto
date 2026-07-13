import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, error } = useAuth();
  return (
    <div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={() => login('test@example.com', 'password123').catch(() => {})}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with unauthenticated state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('error').textContent).toBe('null');
    });

    it('should restore user from stored token', async () => {
      localStorage.setItem('token', 'valid-token');
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'resident',
        }),
      } as Response);

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toContain('test@example.com');
    });
  });

  describe('Login', () => {
    it('should login successfully and set user', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'new-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'resident',
          },
        }),
      } as Response);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Login').click();
      });

      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toContain('test@example.com');
      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('should set error on login failure', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      } as Response);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Login').click();
      });

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toContain('Invalid credentials');
    });
  });

  describe('Logout', () => {
    it('should logout and clear user', async () => {
      // First login
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'new-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'resident',
          },
        }),
      } as Response);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Login').click();
      });

      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');

      // Then logout
      act(() => {
        screen.getByText('Logout').click();
      });

      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
