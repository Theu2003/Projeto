import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders pending status with yellow color', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-yellow');
  });

  it('renders accepted status with blue color', () => {
    render(<StatusBadge status="accepted" />);
    const badge = screen.getByText('Accepted');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-blue');
  });

  it('renders on_the_way status with indigo color', () => {
    render(<StatusBadge status="on_the_way" />);
    const badge = screen.getByText('On the Way');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-indigo');
  });

  it('renders completed status with green color', () => {
    render(<StatusBadge status="completed" />);
    const badge = screen.getByText('Completed');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-green');
  });

  it('renders cancelled status with red color', () => {
    render(<StatusBadge status="cancelled" />);
    const badge = screen.getByText('Cancelled');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red');
  });

  it('renders rescheduled status with orange color', () => {
    render(<StatusBadge status="rescheduled" />);
    const badge = screen.getByText('Rescheduled');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-orange');
  });
});
