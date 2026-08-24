'use client';

import { ContentProps, OptiFormsSubmitElementContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, useFormButton } from '@optimizely/cms-sdk/forms/react';

type FormSubmitProps = {
  content: ContentProps<typeof OptiFormsSubmitElementContentType>;
};

// `w-fit` matters: a button dropped straight into a grid column is a flex item and
// would otherwise stretch to the full column width.
const baseClass =
  'inline-flex w-fit items-center justify-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const roleClass = {
  submit: 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500',
  next: 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500',
  previous:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
};

export default function FormSubmit({ content }: FormSubmitProps) {
  const { role, label, isSubmitting, buttonProps } = useFormButton(content);
  const { pa } = getPreviewUtils(content);

  return (
    <button {...buttonProps} className={`${baseClass} ${roleClass[role]}`}>
      {isSubmitting && (
        <svg
          className='h-4 w-4 animate-spin'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          aria-hidden='true'
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
      <span {...pa('Label')}>{isSubmitting ? 'Submitting…' : label}</span>
    </button>
  );
}
