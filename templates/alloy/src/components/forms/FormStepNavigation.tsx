'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';

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
          className='rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
        >
          Previous
        </button>
      )}
      {showNext && (
        <button
          type='button'
          onClick={nextStep}
          className='rounded-md bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-600'
        >
          Next
        </button>
      )}
    </>
  );

  if (bare) return <div className='flex gap-3'>{buttons}</div>;

  return (
    <div
      className={`mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5 ${
        showPrev ? 'justify-between' : 'justify-end'
      }`}
    >
      {buttons}
    </div>
  );
}
