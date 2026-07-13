import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
  });

  it('displays value when controlled', () => {
    render(<Input value="test@example.com" readOnly />);
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('calls onChange when value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('shows error message when error prop is provided', () => {
    render(<Input error="Email is required" />);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('applies error styling when error prop is provided', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-500');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders with type password', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('renders with type email', () => {
    render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
