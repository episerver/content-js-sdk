'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../util/merge';
import { buttonBase, buttonRoleClass } from './formStyles';

type FormStepNavigationProps = {
  totalSteps: number;
  excludeRoles?: string[];
  bare?: boolean;
};

export default function FormStepNavigation({
  totalSteps,
  excludeRoles = [],
  bare = false,
}: FormStepNavigationProps) {
  const { currentStepIndex, nextStep, prevStep } = useFormStep();

  if (totalSteps < 2) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= totalSteps - 1;

  const showPrev = !isFirst && !excludeRoles.includes('previous');
  const showNext = !isLast && !excludeRoles.includes('next');

  if (!showPrev && !showNext) return null;

  const buttons = (
    <>
      {showPrev && (
        <button
          type='button'
          onClick={prevStep}
          className={cn(buttonBase, buttonRoleClass.previous)}
        >
          Previous
        </button>
      )}
      {showNext && (
        <button
          type='button'
          onClick={nextStep}
          className={cn(buttonBase, buttonRoleClass.next)}
        >
          Next
        </button>
      )}
    </>
  );

  if (bare) return <div className='flex gap-3'>{buttons}</div>;

  return (
    <div
      className={cn(
        'mt-6 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-5',
        'justify-end',
      )}
    >
      {buttons}
    </div>
  );
}
