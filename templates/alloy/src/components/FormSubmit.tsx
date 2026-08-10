'use client';

import { ContentProps, OptiFormsSubmitElementContentType } from '@optimizely/cms-sdk';
import { useFormValidation } from './FormValidationContext';
import { useFormStatus } from './FormStatusProvider';

type FormSubmitProps = {
  content: ContentProps<typeof OptiFormsSubmitElementContentType>;
};

export default function FormSubmit({ content }: FormSubmitProps) {
  const { hasAnyErrors } = useFormValidation();
  const { isSubmitting } = useFormStatus();
  const isDisabled = hasAnyErrors || isSubmitting;

  return (
    <button
      type='submit'
      disabled={isDisabled}
      title={content.Tooltip ?? ''}
      className={`px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-fit flex items-center gap-2 ${
        isDisabled
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
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
