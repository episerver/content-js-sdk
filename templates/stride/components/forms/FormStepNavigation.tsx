'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../lib/utils';

type FormStepNavigationProps = {
  totalSteps: number;
};

export default function FormStepNavigation({ totalSteps }: FormStepNavigationProps) {
  const { currentStepIndex, nextStep, prevStep } = useFormStep();

  if (totalSteps < 2) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= totalSteps - 1;

  return (
    <div
      className={cn(
        'mt-6 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-5',
        isFirst ? 'justify-end' : 'justify-between',
      )}
    >
      {!isFirst && (
        <button
          type='button'
          onClick={prevStep}
          className='rounded-md border border-foreground/20 bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5'
        >
          Previous
        </button>
      )}
      {!isLast && (
        <button
          type='button'
          onClick={nextStep}
          className='rounded-md bg-key1 px-5 py-2.5 text-sm font-medium text-foreground-inverted transition-colors hover:bg-key1/90'
        >
          Next
        </button>
      )}
    </div>
  );
}
