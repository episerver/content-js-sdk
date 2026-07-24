import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';

type FormSelectionProps = {
  content: ContentProps<typeof OptiFormsSelectionElementContentType>;
};

type SelectionOption = {
  text: string;
  value: string;
};

export default function FormSelection({ content }: FormSelectionProps) {
  const options = Array.isArray(content.Options) ? content.Options : [];

  return (
    <div className='space-y-2 flex-1'>
      {content.Label && (
        <label className='block text-sm font-medium text-foreground'>
          {content.Label}
        </label>
      )}
      <select
        title={content.Tooltip ?? ''}
        autoComplete={content.AutoComplete ?? 'off'}
        className='w-full px-4 py-2 rounded-md border border-input text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-key1 focus:border-transparent transition-colors duration-200 bg-white'
      >
        <option value=''>
          {content.Placeholder ?? 'Select an option'}
        </option>
        {options.map((option: SelectionOption) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
      {content.Tooltip && (
        <p className='text-xs text-muted-foreground'>{content.Tooltip}</p>
      )}
    </div>
  );
}
