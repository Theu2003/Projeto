/**
 * T8: Frontend Setup - Electron + React + Vite
 * Tests verify: ThemeContext behavior, App rendering, dark mode toggle,
 * Electron config structure, Vite config, and Tailwind setup.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

function readSrcFile(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf-8');
}

// ─── ThemeContext ──────────────────────────────────────────────────

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('provides light theme by default', async () => {
    const { ThemeProvider, useTheme } = await import('@/contexts/ThemeContext');

    function TestComponent() {
      const { theme, isDark } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="isDark">{String(isDark)}</span>
        </div>
      );
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('isDark').textContent).toBe('false');
  });

  it('toggleTheme switches between light and dark', async () => {
    const { ThemeProvider, useTheme } = await import('@/contexts/ThemeContext');

    function TestComponent() {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /toggle/i }));
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('persists theme choice to localStorage', async () => {
    const { ThemeProvider, useTheme } = await import('@/contexts/ThemeContext');

    function TestComponent() {
      const { toggleTheme } = useTheme();
      return <button onClick={toggleTheme}>Toggle</button>;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /toggle/i }));
    });

    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('applies dark class to document element when dark', async () => {
    const { ThemeProvider, useTheme } = await import('@/contexts/ThemeContext');

    function TestComponent() {
      const { toggleTheme } = useTheme();
      return <button onClick={toggleTheme}>Toggle</button>;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /toggle/i }));
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('throws when useTheme is used outside ThemeProvider', async () => {
    const { useTheme } = await import('@/contexts/ThemeContext');

    function BadComponent() {
      useTheme();
      return null;
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow('useTheme must be used within a ThemeProvider');
    consoleSpy.mockRestore();
  });
});

// ─── App Component ────────────────────────────────────────────────

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders without crashing', async () => {
    const { default: App } = await import('@/App');
    render(<App />);
    // App should render something (the loading spinner or login page)
    expect(document.body).toBeTruthy();
  });

  it('wraps content with ThemeProvider', async () => {
    const { default: App } = await import('@/App');
    const { container } = render(<App />);
    // ThemeProvider adds/removes 'dark' class, so the app should be functional
    expect(container.querySelector('[class*="min-h-screen"]')).toBeTruthy();
  });
});

// ─── Electron Main Process Config ─────────────────────────────────

describe('Electron main process', () => {
  it('main.ts creates BrowserWindow with correct settings', () => {
    const content = readSrcFile('electron/main.ts');
    expect(content).toContain('BrowserWindow');
    expect(content).toContain('contextIsolation: true');
    expect(content).toContain('nodeIntegration: false');
  });

  it('main.ts loads renderer URL or file', () => {
    const content = readSrcFile('electron/main.ts');
    expect(content).toMatch(/loadURL|loadFile/);
  });

  it('main.ts has proper app lifecycle handlers', () => {
    const content = readSrcFile('electron/main.ts');
    expect(content).toContain('app.whenReady');
    expect(content).toContain('window-all-closed');
  });
});

// ─── Electron Preload ─────────────────────────────────────────────

describe('Electron preload', () => {
  it('exposes electronAPI via contextBridge', () => {
    const content = readSrcFile('electron/preload.ts');
    expect(content).toContain('contextBridge');
    expect(content).toContain('exposeInMainWorld');
    expect(content).toContain('electronAPI');
  });

  it('exposes platform, send, on, and invoke methods', () => {
    const content = readSrcFile('electron/preload.ts');
    expect(content).toContain('platform');
    expect(content).toContain('send');
    expect(content).toContain('on');
    expect(content).toContain('invoke');
  });
});

// ─── Electron Vite Config ─────────────────────────────────────────

describe('Electron Vite config', () => {
  it('defines main, preload, and renderer targets', () => {
    const content = readSrcFile('electron/electron.vite.config.ts');
    expect(content).toContain('main');
    expect(content).toContain('preload');
    expect(content).toContain('renderer');
  });

  it('uses React plugin for renderer', () => {
    const content = readSrcFile('electron/electron.vite.config.ts');
    expect(content).toContain('react');
  });

  it('uses externalizeDepsPlugin for main/preload', () => {
    const content = readSrcFile('electron/electron.vite.config.ts');
    expect(content).toContain('externalizeDepsPlugin');
  });
});

// ─── Tailwind Configuration ───────────────────────────────────────

describe('Tailwind CSS configuration', () => {
  it('has darkMode set to class', () => {
    const content = readSrcFile('tailwind.config.js');
    expect(content).toContain('darkMode');
    expect(content).toMatch(/['"]class['"]/);
  });

  it('has content pointing to src directory', () => {
    const content = readSrcFile('tailwind.config.js');
    expect(content).toContain('src/**');
  });

  it('has primary green color palette', () => {
    const content = readSrcFile('tailwind.config.js');
    expect(content).toContain('primary');
    expect(content).toContain('#22c55e');
  });
});

// ─── CSS Entry Point ──────────────────────────────────────────────

describe('CSS entry point', () => {
  it('includes all Tailwind directives', () => {
    const content = readSrcFile('src/index.css');
    expect(content).toContain('@tailwind base');
    expect(content).toContain('@tailwind components');
    expect(content).toContain('@tailwind utilities');
  });
});

// ─── HTML Entry Point ─────────────────────────────────────────────

describe('HTML entry point', () => {
  it('has root div and references main.tsx', () => {
    const content = readSrcFile('src/index.html');
    expect(content).toContain('id="root"');
    expect(content).toContain('main.tsx');
  });
});

// ─── TypeScript Declarations ──────────────────────────────────────

describe('TypeScript setup', () => {
  it('vite-env.d.ts references Vite client types', () => {
    const content = readSrcFile('src/vite-env.d.ts');
    expect(content).toContain('vite/client');
  });
});

// ─── Package.json ─────────────────────────────────────────────────

describe('Package configuration', () => {
  it('has required dependencies', () => {
    const pkg = JSON.parse(readSrcFile('package.json'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps).toHaveProperty('react');
    expect(allDeps).toHaveProperty('react-dom');
    expect(allDeps).toHaveProperty('electron');
    expect(allDeps).toHaveProperty('electron-vite');
    expect(allDeps).toHaveProperty('tailwindcss');
    expect(allDeps).toHaveProperty('vitest');
  });

  it('has dev and build scripts', () => {
    const pkg = JSON.parse(readSrcFile('package.json'));
    expect(pkg.scripts).toHaveProperty('dev');
    expect(pkg.scripts).toHaveProperty('build');
  });
});
