import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '@/components/StarRating';

describe('StarRating', () => {
  it('renders 5 star buttons', () => {
    render(<StarRating value={0} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('highlights stars up to the current value', () => {
    render(<StarRating value={3} />);
    const filled = screen.getAllByTestId('star-filled');
    const empty = screen.getAllByTestId('star-empty');
    expect(filled).toHaveLength(3);
    expect(empty).toHaveLength(2);
  });

  it('calls onChange when a star is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<StarRating value={0} onChange={handleChange} />);

    const stars = screen.getAllByRole('button');
    await user.click(stars[2]); // click 3rd star
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with correct value for each star', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<StarRating value={0} onChange={handleChange} />);

    const stars = screen.getAllByRole('button');
    await user.click(stars[0]);
    expect(handleChange).toHaveBeenCalledWith(1);

    await user.click(stars[4]);
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('does not call onChange when readOnly', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<StarRating value={3} onChange={handleChange} readOnly />);

    const stars = screen.getAllByRole('img');
    await user.click(stars[0]);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders as img role when readOnly', () => {
    render(<StarRating value={2} readOnly />);
    const stars = screen.getAllByRole('img');
    expect(stars).toHaveLength(5);
  });

  it('highlights all stars when value is 5', () => {
    render(<StarRating value={5} />);
    expect(screen.getAllByTestId('star-filled')).toHaveLength(5);
    expect(screen.queryByTestId('star-empty')).not.toBeInTheDocument();
  });

  it('highlights no stars when value is 0', () => {
    render(<StarRating value={0} />);
    expect(screen.queryByTestId('star-filled')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('star-empty')).toHaveLength(5);
  });

  it('applies yellow color to filled stars', () => {
    render(<StarRating value={2} />);
    const filled = screen.getAllByTestId('star-filled');
    filled.forEach((star) => {
      expect(star.className).toContain('text-yellow-400');
    });
  });
});
