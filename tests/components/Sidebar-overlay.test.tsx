import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(() => 'test-token'),
  },
}));

describe('Sidebar - overlay behavior', () => {
  it('shows overlay when sidebar is open on mobile', () => {
    render(
      <MemoryRouter>
        <Sidebar role="resident" isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // Overlay should be present when isOpen is true
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Sidebar role="resident" isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement;
    expect(overlay).toBeInTheDocument();
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show overlay when sidebar is closed', () => {
    render(
      <MemoryRouter>
        <Sidebar role="resident" isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(overlay).not.toBeInTheDocument();
  });
});
