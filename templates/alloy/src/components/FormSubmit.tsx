'use client';

import { ContentProps, OptiFormsSubmitElementContentType } from '@optimizely/cms-sdk';
import { useFormValidation, useFormStatus, useFormStep as useFormSteps } from '@optimizely/cms-sdk/forms/react';

type FormSubmitProps = {
  content: ContentProps<typeof OptiFormsSubmitElementContentType>;
};

export default function FormSubmit({ content }: FormSubmitProps) {
  const { hasAnyErrors } = useFormValidation();
  const { isSubmitting } = useFormStatus();
  const { nextStep, prevStep } = useFormSteps();
  const label = content.Label?.toLowerCase() ?? '';
  const isNext = label === 'next';
  const isPrev = label === 'previous';
  const isDisabled = (isNext || isPrev ? false : hasAnyErrors) || isSubmitting;

  return (
    <button
      type={isNext || isPrev ? 'button' : 'submit'}
      onClick={isNext ? nextStep : isPrev ? prevStep : undefined}
      disabled={isDisabled}
      title={content.Tooltip ?? ''}
      className={`px-6 py-3 mt-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 ${
        !isPrev ? 'ml-auto' : '-'
      } ${
        isDisabled
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
          : isPrev
            ? 'bg-gray-200 text-slate-700 hover:bg-gray-300 focus:ring-gray-300'
            : 'bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-700'
      }`}
    >
      {isSubmitting && (
        <svg
          className='animate-spin h-4 w-4'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      )}
      <span>{isSubmitting ? 'Submitting...' : content.Label ?? 'Submit'}</span>
    </button>
  );
}
