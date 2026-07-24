import { ContentProps, OptiFormsTextboxElementContentType } from '@optimizely/cms-sdk';

type FormInputProps = {
  content: ContentProps<typeof OptiFormsTextboxElementContentType>;
};

export default function FormInput({ content }: FormInputProps) {
  return (
    <div className='space-y-2 flex-1'>
      {content.Label && (
        <label className='block text-sm font-medium text-foreground'>
          {content.Label}
        </label>
      )}
      <input
        type='text'
        placeholder={content.Placeholder ?? ''}
        defaultValue={content.PredefinedValue ?? ''}
        title={content.Tooltip ?? ''}
        autoComplete={content.AutoComplete ?? 'off'}
        className='w-full px-4 py-2 rounded-md border border-input text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-key1 focus:border-transparent transition-colors duration-200'
      />
      {content.Tooltip && (
        <p className='text-xs text-muted-foreground'>{content.Tooltip}</p>
      )}
    </div>
  );
}

