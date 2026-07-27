import { ContentProps, OptiFormsSubmitElementContentType } from '@optimizely/cms-sdk';

type FormSubmitProps = {
  content: ContentProps<typeof OptiFormsSubmitElementContentType>;
};

export default function FormSubmit({ content }: FormSubmitProps) {
  return (
    <button
      type='submit'
      title={content.Tooltip ?? ''}
      className='px-6 py-3 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2'
    >
      {content.Label ?? 'Submit'}
    </button>
  );
}

