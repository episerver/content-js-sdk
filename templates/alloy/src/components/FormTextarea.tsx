import { ContentProps, OptiFormsTextareaElementContentType } from '@optimizely/cms-sdk';

type FormTextareaProps = {
  content: ContentProps<typeof OptiFormsTextareaElementContentType>;
};

export default function FormTextarea({ content }: FormTextareaProps) {
  return (
    <div className='space-y-2 flex-1'>
      {content.Label && (
        <label className='block text-sm font-medium text-foreground'>
          {content.Label}
        </label>
      )}
      <textarea
        placeholder={content.Placeholder ?? ''}
        defaultValue={content.PredefinedValue ?? ''}
        title={content.Tooltip ?? ''}
        autoComplete={content.AutoComplete ?? 'off'}
        rows={4}
        className='w-full px-4 py-2 rounded-md border border-input text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-key1 focus:border-transparent transition-colors duration-200 resize-vertical'
      />
      {content.Tooltip && (
        <p className='text-xs text-muted-foreground'>{content.Tooltip}</p>
      )}
    </div>
  );
}

