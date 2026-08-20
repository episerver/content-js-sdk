'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';

type FormStepTrackerProps = {
  steps: number;
};

export default function FormStepTracker({ steps }: FormStepTrackerProps) {
  const { currentStepIndex } = useFormStep();

  return (
    <div className='flex items-center justify-center gap-2 mb-8'>
      {Array.from({ length: steps }).map((_, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={index} className='flex items-center'>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                isCurrent
                  ? 'bg-green-500 text-white'
                  : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            {index < steps - 1 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
