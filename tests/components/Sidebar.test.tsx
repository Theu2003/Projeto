import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(() => 'test-token'),
  },
}));

describe('Sidebar', () => {
  const renderSidebar = (role: 'resident' | 'company' | 'admin' = 'resident') => {
    return render(
      <MemoryRouter>
        <Sidebar role={role} isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );
  };

  it('renders the EcoColeta brand', () => {
    renderSidebar();
    expect(screen.getByText('EcoColeta')).toBeInTheDocument();
  });

  it('shows resident navigation links for resident role', () => {
    renderSidebar('resident');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nova Solicitação')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
  });

  it('shows company navigation links for company role', () => {
    renderSidebar('company');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mapa')).toBeInTheDocument();
    expect(screen.getByText('Solicitações')).toBeInTheDocument();
    expect(screen.getByText('Processar Coleta')).toBeInTheDocument();
  });

  it('shows admin navigation links for admin role', () => {
    renderSidebar('admin');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('does not show company links for resident', () => {
    renderSidebar('resident');
    expect(screen.queryByText('Mapa')).not.toBeInTheDocument();
    expect(screen.queryByText('Solicitações')).not.toBeInTheDocument();
  });

  it('does not show resident links for company', () => {
    renderSidebar('company');
    expect(screen.queryByText('Nova Solicitação')).not.toBeInTheDocument();
    expect(screen.queryByText('Ranking')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Sidebar role="resident" isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const closeButton = screen.getByLabelText(/fechar menu/i);
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nav links with correct hrefs for resident', () => {
    renderSidebar('resident');
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Nova Solicitação').closest('a')).toHaveAttribute('href', '/requests/new');
    expect(screen.getByText('Histórico').closest('a')).toHaveAttribute('href', '/history');
    expect(screen.getByText('Ranking').closest('a')).toHaveAttribute('href', '/ranking');
  });
});
