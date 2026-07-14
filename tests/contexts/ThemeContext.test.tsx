import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Test component that uses the theme context
function TestComponent() {
  const { theme, toggleTheme, isDark } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="is-dark">{isDark.toString()}</div>
      <div data-testid="html-class">{document.documentElement.className}</div>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  let matchMediaSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';

    // Reset matchMedia mock to default (light mode)
    matchMediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    matchMediaSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('should default to light theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(screen.getByTestId('is-dark').textContent).toBe('false');
    });

    it('should use system preference when no stored theme', () => {
      // Mock dark mode preference
      matchMediaSpy.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme').textContent).toBe('dark');
      expect(screen.getByTestId('is-dark').textContent).toBe('true');
    });

    it('should restore theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme').textContent).toBe('dark');
      expect(screen.getByTestId('is-dark').textContent).toBe('true');
    });
  });

  describe('Toggle Theme', () => {
    it('should toggle from light to dark', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Verify initial state is light
      expect(screen.getByTestId('theme').textContent).toBe('light');

      act(() => {
        screen.getByText('Toggle').click();
      });

      expect(screen.getByTestId('theme').textContent).toBe('dark');
      expect(screen.getByTestId('is-dark').textContent).toBe('true');
    });

    it('should toggle from dark to light', () => {
      localStorage.setItem('theme', 'dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme').textContent).toBe('dark');

      act(() => {
        screen.getByText('Toggle').click();
      });

      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(screen.getByTestId('is-dark').textContent).toBe('false');
    });

    it('should persist theme to localStorage', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByText('Toggle').click();
      });

      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });

  describe('Dark Class on HTML Element', () => {
    it('should add dark class when dark theme', () => {
      localStorage.setItem('theme', 'dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when light theme', () => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should toggle dark class on toggle', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(false);

      act(() => {
        screen.getByText('Toggle').click();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
