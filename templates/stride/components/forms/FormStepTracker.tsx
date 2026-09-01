'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../lib/utils';

type FormStepTrackerProps = {
  steps: number;
};

export default function FormStepTracker({ steps }: FormStepTrackerProps) {
  const { currentStepIndex } = useFormStep();

  // A single-step form is just a form. Showing it a progress bar of one is noise.
  if (steps < 2) return null;

  return (
    <div className='space-y-3'>
      <p className='text-xs font-semibold uppercase tracking-wider text-foreground2'>
        Step {currentStepIndex + 1} of {steps}
      </p>

      <ol className='flex items-center' aria-label='Form progress'>
        {Array.from({ length: steps }).map((_, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li
              key={index}
              className={cn('flex items-center', index < steps - 1 && 'flex-1')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isCompleted ? 'bg-key1 text-foreground-inverted'
                  : isCurrent ? 'bg-background text-key1 ring-2 ring-key1'
                  : 'bg-background text-foreground2 ring-1 ring-foreground/15',
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </span>

              {index < steps - 1 && (
                <span
                  className={cn(
                    'mx-2 h-px flex-1',
                    isCompleted ? 'bg-key1' : 'bg-foreground/15',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
