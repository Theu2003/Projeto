import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, Column, DataTableAction } from '@/components/DataTable';

interface TestRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'active', header: 'Status', render: (row) => (row.active ? 'Active' : 'Inactive') },
];

const sampleData: TestRow[] = [
  { id: '1', name: 'Alice', email: 'alice@test.com', active: true },
  { id: '2', name: 'Bob', email: 'bob@test.com', active: false },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<DataTable columns={columns} data={sampleData} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('uses custom render function for column', () => {
    render(<DataTable columns={columns} data={sampleData} />);
    const activeCells = screen.getAllByText('Active');
    expect(activeCells.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records found." />);
    expect(screen.getByText('No records found.')).toBeInTheDocument();
  });

  it('does not render actions column when no actions provided', () => {
    render(<DataTable columns={columns} data={sampleData} />);
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });

  it('renders action buttons when actions provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const actions: DataTableAction<TestRow>[] = [
      { label: 'Edit', onClick: handleClick },
    ];

    render(<DataTable columns={columns} data={sampleData} actions={actions} />);
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(2);
  });

  it('calls onClick with correct row when action button clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const actions: DataTableAction<TestRow>[] = [
      { label: 'Select', onClick: handleClick },
    ];

    render(<DataTable columns={columns} data={sampleData} actions={actions} />);
    const buttons = screen.getAllByText('Select');
    await user.click(buttons[0]);
    expect(handleClick).toHaveBeenCalledWith(sampleData[0]);
  });

  it('supports dynamic action label via function', () => {
    const actions: DataTableAction<TestRow>[] = [
      { label: (row) => (row.active ? 'Block' : 'Activate'), onClick: vi.fn() },
    ];

    render(<DataTable columns={columns} data={sampleData} actions={actions} />);
    expect(screen.getByText('Block')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
  });

  it('hides action button when dynamic label returns null', () => {
    const actions: DataTableAction<TestRow>[] = [
      { label: (row) => (row.active ? 'Delete' : null), onClick: vi.fn() },
    ];

    render(<DataTable columns={columns} data={sampleData} actions={actions} />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).toBeInTheDocument();
    // Bob has active=false so Delete should be hidden for Bob
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(1);
  });

  it('renders caption when provided', () => {
    render(<DataTable columns={columns} data={sampleData} caption="User list" />);
    expect(screen.getByText('User list')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DataTable columns={columns} data={sampleData} className="custom-table" />);
    const table = screen.getByRole('table');
    expect(table.className).toContain('custom-table');
  });
});
