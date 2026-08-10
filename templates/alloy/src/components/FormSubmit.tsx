'use client';

import { ContentProps, OptiFormsSubmitElementContentType } from '@optimizely/cms-sdk';
import { useFormValidation } from './FormValidationContext';

type FormSubmitProps = {
  content: ContentProps<typeof OptiFormsSubmitElementContentType>;
};

export default function FormSubmit({ content }: FormSubmitProps) {
  const { hasAnyErrors } = useFormValidation();

  return (
    <button
      type='submit'
      disabled={hasAnyErrors}
      title={content.Tooltip ?? ''}
      className={`px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-fit ${
        hasAnyErrors
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
          : 'bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-700'
      }`}
    >
      {content.Label ?? 'Submit'}
    </button>
  );
}
