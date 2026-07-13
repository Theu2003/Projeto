import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '@/components/NotificationBell';
import { Notification } from '@/types';

describe('NotificationBell', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'request_accepted',
      message: 'Sua solicitação foi aceita!',
      read: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      type: 'request_completed',
      message: 'Coleta concluída',
      read: true,
      createdAt: '2024-01-14T08:00:00Z',
    },
    {
      id: '3',
      type: 'new_request',
      message: 'Nova solicitação disponível',
      read: false,
      createdAt: '2024-01-15T12:00:00Z',
    },
  ];

  it('renders the bell icon', () => {
    render(<NotificationBell notifications={[]} onMarkAsRead={vi.fn()} />);
    expect(screen.getByLabelText(/notificações/i)).toBeInTheDocument();
  });

  it('shows unread count when there are unread notifications', () => {
    render(<NotificationBell notifications={mockNotifications} onMarkAsRead={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show count when all notifications are read', () => {
    const readNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
    render(<NotificationBell notifications={readNotifications} onMarkAsRead={vi.fn()} />);
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('does not show count badge when no notifications', () => {
    render(<NotificationBell notifications={[]} onMarkAsRead={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('opens dropdown when bell is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell notifications={mockNotifications} onMarkAsRead={vi.fn()} />);

    await user.click(screen.getByLabelText(/notificações/i));
    expect(screen.getByText('Sua solicitação foi aceita!')).toBeInTheDocument();
    expect(screen.getByText('Coleta concluída')).toBeInTheDocument();
    expect(screen.getByText('Nova solicitação disponível')).toBeInTheDocument();
  });

  it('calls onMarkAsRead when a notification is clicked', async () => {
    const onMarkAsRead = vi.fn();
    const user = userEvent.setup();
    render(<NotificationBell notifications={mockNotifications} onMarkAsRead={onMarkAsRead} />);

    await user.click(screen.getByLabelText(/notificações/i));
    await user.click(screen.getByText('Sua solicitação foi aceita!'));
    expect(onMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('shows "Nenhuma notificação" when list is empty', async () => {
    const user = userEvent.setup();
    render(<NotificationBell notifications={[]} onMarkAsRead={vi.fn()} />);

    await user.click(screen.getByLabelText(/notificações/i));
    expect(screen.getByText(/nenhuma notificação/i)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <NotificationBell notifications={mockNotifications} onMarkAsRead={vi.fn()} />
      </div>
    );

    await user.click(screen.getByLabelText(/notificações/i));
    expect(screen.getByText('Sua solicitação foi aceita!')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByText('Sua solicitação foi aceita!')).not.toBeInTheDocument();
  });

  it('marks unread notifications with distinct styling', async () => {
    const user = userEvent.setup();
    render(<NotificationBell notifications={mockNotifications} onMarkAsRead={vi.fn()} />);

    await user.click(screen.getByLabelText(/notificações/i));
    const unreadItem = screen.getByText('Sua solicitação foi aceita!').closest('li');
    const readItem = screen.getByText('Coleta concluída').closest('li');
    expect(unreadItem?.className).toContain('bg-green-50');
    expect(readItem?.className).not.toContain('bg-green-50');
  });
});
