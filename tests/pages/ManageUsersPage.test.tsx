import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageUsersPage } from '@/pages/admin/ManageUsersPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockUsers = [
  { id: '1', name: 'Alice', email: 'alice@test.com', role: 'resident', active: true, points: 500 },
  { id: '2', name: 'Bob', email: 'bob@test.com', role: 'resident', active: false, points: 200 },
  { id: '3', name: 'Admin', email: 'admin@test.com', role: 'admin', active: true, points: 0 },
];

describe('ManageUsersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<ManageUsersPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders user list after data loads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockUsers);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders user emails in the table', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockUsers);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });

    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('shows block action for active users', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockUsers);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Block').length).toBeGreaterThan(0);
    });
  });

  it('shows activate action for inactive users', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockUsers);
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Activate').length).toBeGreaterThan(0);
    });
  });

  it('calls API to toggle user status', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValue(mockUsers);
    vi.mocked(apiClient.put).mockResolvedValue({});

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Block').length).toBeGreaterThan(0);
    });

    const blockButtons = screen.getAllByText('Block');
    await user.click(blockButtons[0]);

    expect(apiClient.put).toHaveBeenCalledWith('/admin/users/1/toggle-active');
  });

  it('shows error message on load failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
