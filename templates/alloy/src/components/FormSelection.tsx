import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';

type FormSelectionProps = {
  content: ContentProps<typeof OptiFormsSelectionElementContentType>;
};

type SelectionOption = {
  label: string;
  value: string;
  selected?: boolean;
};

export default function FormSelection({ content }: FormSelectionProps) {
  const options = Array.isArray(content.Options) ? content.Options : [];

  return (
    <fieldset className='space-y-3 flex-1'>
      {content.Label && (
        <legend className='text-sm font-medium text-foreground'>{content.Label}</legend>
      )}
      <div className='grid grid-cols-2 gap-3'>
        {options.map((option: SelectionOption) => (
          <label
            key={option.value}
            className='flex items-center p-3 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors'
          >
            <input
              type='radio'
              name={content.Label || 'selection'}
              value={option.value}
              defaultChecked={option.selected}
              title={content.Tooltip ?? ''}
              className='w-4 h-4 cursor-pointer'
            />
            <span className='ml-3 text-sm text-foreground'>{option.label}</span>
          </label>
        ))}
      </div>
      {content.Tooltip && (
        <p className='text-xs text-muted-foreground'>{content.Tooltip}</p>
      )}
    </fieldset>
  );
}
