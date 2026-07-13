import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '@/components/Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Title"><p>Content</p></Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Card title="Title" subtitle="My Subtitle"><p>Content</p></Card>);
    expect(screen.getByText('My Subtitle')).toBeInTheDocument();
  });

  it('does not render title/subtitle section when neither provided', () => {
    const { container } = render(<Card><p>Content</p></Card>);
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  it('applies dark mode classes', () => {
    render(<Card><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('dark:bg-gray-800');
  });

  it('applies rounded-xl styling', () => {
    render(<Card><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('rounded-xl');
  });
});

describe('Card - hoverable and clickable', () => {
  it('applies hover styles when hoverable is true', () => {
    render(<Card hoverable><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('hover:shadow-lg');
    expect(card?.className).toContain('cursor-pointer');
  });

  it('does not apply hover styles when hoverable is false', () => {
    render(<Card><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).not.toContain('hover:shadow-lg');
    expect(card?.className).not.toContain('cursor-pointer');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}><p>Content</p></Card>);
    await user.click(screen.getByText('Content').closest('div')!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('sets role="button" when onClick is provided', () => {
    render(<Card onClick={() => {}}><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('does not set role when no onClick', () => {
    render(<Card><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).not.toHaveAttribute('role');
  });

  it('handles keyboard Enter on clickable card', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}><p>Content</p></Card>);
    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<Card className="custom-class"><p>Content</p></Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card?.className).toContain('custom-class');
  });
});
