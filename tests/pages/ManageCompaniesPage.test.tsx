import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageCompaniesPage } from '@/pages/admin/ManageCompaniesPage';
import { apiClient } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockCompanies = [
  { id: '1', name: 'GreenRecycle', email: 'green@test.com', cnpj: '12345678000101', approved: true, active: true, rating: 4.5 },
  { id: '2', name: 'EcoWaste', email: 'eco@test.com', cnpj: '98765432000102', approved: false, active: true, rating: 0 },
  { id: '3', name: 'RecyclePro', email: 'recycle@test.com', cnpj: '55555555000103', approved: true, active: false, rating: 3.2 },
];

describe('ManageCompaniesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    render(<ManageCompaniesPage />);
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });

  it('renders company list after data loads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockCompanies);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Companies')).toBeInTheDocument();
    });

    expect(screen.getByText('GreenRecycle')).toBeInTheDocument();
    expect(screen.getByText('EcoWaste')).toBeInTheDocument();
    expect(screen.getByText('RecyclePro')).toBeInTheDocument();
  });

  it('shows approve button for unapproved companies', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockCompanies);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
    });
  });

  it('shows block/unblock actions', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockCompanies);
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Block').length).toBe(2);
    });

    expect(screen.getAllByText('Unblock').length).toBe(1);
  });

  it('calls API to approve company', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValue(mockCompanies);
    vi.mocked(apiClient.put).mockResolvedValue({});

    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
    });

    const approveButtons = screen.getAllByText('Approve');
    await user.click(approveButtons[0]);

    expect(apiClient.put).toHaveBeenCalledWith('/admin/companies/2/approve');
  });

  it('calls API to toggle company active status', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValue(mockCompanies);
    vi.mocked(apiClient.put).mockResolvedValue({});

    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Block').length).toBeGreaterThan(0);
    });

    const blockButtons = screen.getAllByText('Block');
    await user.click(blockButtons[0]);

    expect(apiClient.put).toHaveBeenCalledWith('/admin/companies/1/toggle-active');
  });

  it('shows error message on load failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<ManageCompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
