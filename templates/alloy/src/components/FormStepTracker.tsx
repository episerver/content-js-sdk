'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';

type FormStepTrackerProps = {
  steps: number;
};

export default function FormStepTracker({ steps }: FormStepTrackerProps) {
  const { currentStepIndex } = useFormStep();

  // A single-step form is just a form. Showing it a progress bar of one is noise.
  if (steps < 2) return null;

  return (
    <div className='space-y-3'>
      <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>
        Step {currentStepIndex + 1} of {steps}
      </p>

      <ol className='flex items-center' aria-label='Form progress'>
        {Array.from({ length: steps }).map((_, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li
              key={index}
              className={index < steps - 1 ? 'flex flex-1 items-center' : 'flex items-center'}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted ? 'bg-teal-500 text-white'
                  : isCurrent ? 'bg-white text-teal-600 ring-2 ring-teal-500'
                  : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200'
                }`}
              >
                {isCompleted ?
                  <svg
                    className='h-4 w-4'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                : index + 1}
              </span>

              {index < steps - 1 && (
                <span
                  className={`mx-2 h-px flex-1 ${isCompleted ? 'bg-teal-500' : 'bg-gray-200'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
