import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBadge } from '@/components/StatusBadge';

describe('Button', () => {
  it('renders as anchor when href is provided', () => {
    render(<Button href="/dashboard">Dashboard</Button>);
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('applies fullWidth class when fullWidth is true', () => {
    render(<Button fullWidth>Submit</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('disables button and shows spinner when isLoading is true', async () => {
    render(<Button isLoading>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('does not call onClick when isLoading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Loading</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with all three variants', () => {
    const { rerender } = render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button').className).toContain('bg-green-600');

    rerender(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole('button').className).toContain('bg-gray-200');

    rerender(<Button variant="danger">Test</Button>);
    expect(screen.getByRole('button').className).toContain('bg-red-600');
  });

  it('renders with all three sizes', () => {
    const { rerender } = render(<Button size="small">Test</Button>);
    expect(screen.getByRole('button').className).toContain('px-3');

    rerender(<Button size="medium">Test</Button>);
    expect(screen.getByRole('button').className).toContain('px-4');

    rerender(<Button size="large">Test</Button>);
    expect(screen.getByRole('button').className).toContain('px-6');
  });

  it('forwards additional HTML attributes', () => {
    render(<Button data-testid="custom-btn" aria-label="Custom">Click</Button>);
    const btn = screen.getByTestId('custom-btn');
    expect(btn).toHaveAttribute('aria-label', 'Custom');
  });
});

describe('Input', () => {
  it('associates label with input via htmlFor', () => {
    render(<Input label="Email Address" />);
    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('shows required indicator asterisk when required', () => {
    render(<Input label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message below input', () => {
    render(<Input error="Field is required" />);
    expect(screen.getByText('Field is required')).toBeInTheDocument();
  });

  it('applies error border class', () => {
    render(<Input error="Invalid" />);
    expect(screen.getByRole('textbox').className).toContain('border-red-500');
  });

  it('generates unique ids for multiple inputs', () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>
    );
    const firstInput = screen.getByLabelText('First');
    const secondInput = screen.getByLabelText('Second');
    expect(firstInput.id).not.toBe(secondInput.id);
  });

  it('uses custom id when provided', () => {
    render(<Input id="custom-id" label="Test" />);
    expect(screen.getByLabelText('Test')).toHaveAttribute('id', 'custom-id');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="password" />);
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();

    rerender(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  const statuses = [
    { status: 'pending' as const, label: 'Pending', color: 'bg-yellow' },
    { status: 'accepted' as const, label: 'Accepted', color: 'bg-blue' },
    { status: 'on_the_way' as const, label: 'On the Way', color: 'bg-indigo' },
    { status: 'completed' as const, label: 'Completed', color: 'bg-green' },
    { status: 'cancelled' as const, label: 'Cancelled', color: 'bg-red' },
    { status: 'rescheduled' as const, label: 'Rescheduled', color: 'bg-orange' },
  ];

  statuses.forEach(({ status, label, color }) => {
    it(`renders "${label}" with correct color for status "${status}"`, () => {
      render(<StatusBadge status={status} />);
      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain(color);
    });
  });

  it('renders as a span element', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('Pending');
    expect(badge.tagName).toBe('SPAN');
  });

  it('has rounded-full styling', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed').className).toContain('rounded-full');
  });

  it('has small text size', () => {
    render(<StatusBadge status="accepted" />);
    expect(screen.getByText('Accepted').className).toContain('text-xs');
  });
});

describe('Button interaction', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders children text', () => {
    render(<Button>Save Changes</Button>);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});

describe('Input interaction', () => {
  it('displays placeholder text', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('accepts text input', async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('renders without label when label is not provided', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('forwards onChange handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });
});
