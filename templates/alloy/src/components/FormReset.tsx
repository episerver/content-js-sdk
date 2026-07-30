import { ContentProps, OptiFormsResetElementContentType } from '@optimizely/cms-sdk';

type FormResetProps = {
  content: ContentProps<typeof OptiFormsResetElementContentType>;
};

export default function FormReset({ content }: FormResetProps) {
  return (
    <button
      type='reset'
      title={content.Tooltip ?? ''}
      className='px-6 py-3 rounded-lg bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 w-fit ml-auto'
    >
      {content.Label ?? 'Reset'}
    </button>
  );
}
