interface TimelineStep {
  label: string;
  completed: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  const activeIndex = steps.findIndex((step) => !step.completed);

  return (
    <div className="flex flex-col">
      {steps.map((step, index) => {
        const isCompleted = step.completed;
        const isActive = index === activeIndex;

        return (
          <div
            key={index}
            className="flex items-start gap-3"
            data-testid={
              isCompleted ? 'step-completed' : isActive ? 'step-active' : 'step-incomplete'
            }
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-8 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
            <span
              className={`pt-1 text-sm ${
                isCompleted
                  ? 'text-green-600 font-medium'
                  : isActive
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
