import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Card title="My Card">Content</Card>);
    expect(screen.getByText('My Card')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(<Card title="Title" subtitle="Subtitle">Content</Card>);
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('applies default card styling', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('rounded-xl');
    expect(card?.className).toContain('shadow-md');
  });

  it('applies hover effect when hoverable is true', () => {
    render(<Card hoverable>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('hover:shadow-lg');
    expect(card?.className).toContain('cursor-pointer');
  });

  it('does not apply hover effect by default', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).not.toContain('hover:shadow-lg');
  });

  it('applies padding', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('p-6');
  });

  it('renders without title or subtitle', () => {
    render(<Card>Just content</Card>);
    expect(screen.getByText('Just content')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
