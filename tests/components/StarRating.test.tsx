import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '@/components/StarRating';

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating value={0} onChange={() => {}} />);
    const stars = screen.getAllByRole('button', { name: /star/i });
    expect(stars).toHaveLength(5);
  });

  it('highlights stars up to the current value', () => {
    render(<StarRating value={3} onChange={() => {}} />);
    const filledStars = screen.getAllByTestId('star-filled');
    expect(filledStars).toHaveLength(3);
  });

  it('calls onChange when a star is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<StarRating value={0} onChange={handleChange} />);
    
    const stars = screen.getAllByRole('button', { name: /star/i });
    await user.click(stars[2]); // Click 3rd star
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('renders in read-only mode', () => {
    render(<StarRating value={4} onChange={() => {}} readOnly />);
    const stars = screen.getAllByRole('img', { name: /star/i });
    expect(stars).toHaveLength(5);
  });

  it('does not call onChange in read-only mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<StarRating value={3} onChange={handleChange} readOnly />);
    
    const stars = screen.getAllByRole('img', { name: /star/i });
    await user.click(stars[0]);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
