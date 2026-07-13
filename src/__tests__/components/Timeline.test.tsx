import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timeline } from '@/components/Timeline';

describe('Timeline', () => {
  it('renders all step labels', () => {
    render(
      <Timeline
        steps={[
          { label: 'Step One', completed: true },
          { label: 'Step Two', completed: false },
          { label: 'Step Three', completed: false },
        ]}
      />
    );
    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();
  });

  it('marks completed steps with checkmark icon', () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: 'Done', completed: true },
          { label: 'Pending', completed: false },
        ]}
      />
    );
    const completedSteps = container.querySelectorAll('[data-testid="step-completed"]');
    expect(completedSteps).toHaveLength(1);
    expect(completedSteps[0].querySelector('svg')).toBeInTheDocument();
  });

  it('marks the first incomplete step as active', () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: 'Done', completed: true },
          { label: 'Current', completed: false },
          { label: 'Future', completed: false },
        ]}
      />
    );
    const activeSteps = container.querySelectorAll('[data-testid="step-active"]');
    expect(activeSteps).toHaveLength(1);
    expect(activeSteps[0].textContent).toContain('Current');
  });

  it('marks future steps as incomplete', () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: 'Done', completed: true },
          { label: 'Current', completed: false },
          { label: 'Future', completed: false },
        ]}
      />
    );
    const incompleteSteps = container.querySelectorAll('[data-testid="step-incomplete"]');
    expect(incompleteSteps).toHaveLength(1);
    expect(incompleteSteps[0].textContent).toContain('Future');
  });

  it('renders connector lines between steps', () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: 'Step 1', completed: true },
          { label: 'Step 2', completed: false },
        ]}
      />
    );
    const connectors = container.querySelectorAll('.w-0\\.5');
    expect(connectors.length).toBeGreaterThanOrEqual(1);
  });

  it('applies green class to connector after completed step', () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: 'Done', completed: true },
          { label: 'Next', completed: false },
        ]}
      />
    );
    const connectors = container.querySelectorAll('.bg-green-600');
    expect(connectors.length).toBeGreaterThanOrEqual(1);
  });

  it('renders single step correctly', () => {
    render(<Timeline steps={[{ label: 'Only Step', completed: true }]} />);
    expect(screen.getByText('Only Step')).toBeInTheDocument();
  });

  it('renders all steps as completed when all are done', () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: 'Step 1', completed: true },
          { label: 'Step 2', completed: true },
          { label: 'Step 3', completed: true },
        ]}
      />
    );
    const completedSteps = container.querySelectorAll('[data-testid="step-completed"]');
    expect(completedSteps).toHaveLength(3);
  });

  it('renders step numbers for incomplete steps', () => {
    render(
      <Timeline
        steps={[
          { label: 'Done', completed: true },
          { label: 'Second', completed: false },
          { label: 'Third', completed: false },
        ]}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
