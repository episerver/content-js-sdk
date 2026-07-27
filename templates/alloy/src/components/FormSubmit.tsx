import { ContentProps, OptiFormsSubmitElementContentType } from '@optimizely/cms-sdk';

type FormSubmitProps = {
  content: ContentProps<typeof OptiFormsSubmitElementContentType>;
};

export default function FormSubmit({ content }: FormSubmitProps) {
  return (
    <button
      type='submit'
      title={content.Tooltip ?? ''}
      className='px-6 py-2 rounded-md bg-key1 text-white font-medium hover:bg-key1/90 transition-colors focus:outline-none focus:ring-2 focus:ring-key1 focus:ring-offset-2'
    >
      {content.Label ?? 'Submit'}
    </button>
  );
}

