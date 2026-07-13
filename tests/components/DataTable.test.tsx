import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, Column } from '@/components/DataTable';

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

const testData: TestRow[] = [
  { id: '1', name: 'Alice', email: 'alice@test.com', active: true },
  { id: '2', name: 'Bob', email: 'bob@test.com', active: false },
  { id: '3', name: 'Charlie', email: 'charlie@test.com', active: true },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={testData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    render(<DataTable columns={columns} data={testData} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('renders custom content via render function', () => {
    render(<DataTable columns={columns} data={testData} />);
    const activeRows = screen.getAllByText('Active');
    const inactiveRows = screen.getAllByText('Inactive');
    expect(activeRows.length).toBe(2);
    expect(inactiveRows.length).toBe(1);
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records found" />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('does not render table body when data is empty and no emptyMessage', () => {
    const { container } = render(<DataTable columns={columns} data={[]} />);
    expect(container.querySelector('tbody')).toBeNull();
  });

  it('renders action buttons and calls onAction with correct row', async () => {
    const user = userEvent.setup();
    const actions = [
      { label: 'Edit', onClick: vi.fn() },
    ];

    render(<DataTable columns={columns} data={testData} actions={actions} />);

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBe(3);

    await user.click(editButtons[1]);
    expect(actions[0].onClick).toHaveBeenCalledWith(testData[1]);
  });

  it('supports custom className on the table', () => {
    const { container } = render(
      <DataTable columns={columns} data={testData} className="custom-table" />
    );
    const table = container.querySelector('table');
    expect(table?.className).toContain('custom-table');
  });

  it('renders a caption when provided', () => {
    render(<DataTable columns={columns} data={testData} caption="User List" />);
    expect(screen.getByText('User List')).toBeInTheDocument();
  });
});
