import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timeline } from '@/components/Timeline';

const steps = [
  { label: 'Request Created', completed: true },
  { label: 'Accepted', completed: true },
  { label: 'On the Way', completed: false },
  { label: 'Completed', completed: false },
];

describe('Timeline', () => {
  it('renders all steps', () => {
    render(<Timeline steps={steps} />);
    expect(screen.getByText('Request Created')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('On the Way')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('marks completed steps with check icon', () => {
    render(<Timeline steps={steps} />);
    const completedSteps = screen.getAllByTestId('step-completed');
    expect(completedSteps).toHaveLength(2);
  });

  it('marks incomplete steps without check icon', () => {
    render(<Timeline steps={steps} />);
    const incompleteSteps = screen.getAllByTestId('step-incomplete');
    expect(incompleteSteps).toHaveLength(1);
  });

  it('highlights the current (first incomplete) step', () => {
    render(<Timeline steps={steps} />);
    const activeStep = screen.getByTestId('step-active');
    expect(activeStep).toHaveTextContent('On the Way');
  });

  it('renders empty timeline gracefully', () => {
    render(<Timeline steps={[]} />);
    expect(screen.queryByTestId('step-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-incomplete')).not.toBeInTheDocument();
  });
});
