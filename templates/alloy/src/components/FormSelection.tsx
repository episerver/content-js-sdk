'use client';

import { useState } from 'react';
import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';
import { validateField, getErrorMessages } from '../utils/formValidation';

type FormSelectionProps = {
  content: ContentProps<typeof OptiFormsSelectionElementContentType>;
};

type SelectionOption = {
  label: string;
  value: string;
  selected?: boolean;
};

export default function FormSelection({ content }: FormSelectionProps) {
  const options = (
    Array.isArray(content.Options) ?
      content.Options
    : []) as SelectionOption[];

  const [value, setValue] = useState(options.find(opt => opt.selected)?.value ?? '');
  const [isTouched, setIsTouched] = useState(false);

  const errors = validateField(value, (content.Validators as any) ?? []);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = isTouched && hasErrors;

  return (
    <fieldset className='space-y-3 flex-1'>
      {content.Label && (
        <legend className='text-sm font-medium text-foreground'>{content.Label}</legend>
      )}
      <div className='grid grid-cols-2 gap-3'>
        {options.map(option => (
          <label
            key={option.value}
            className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
              showErrors ? 'border-red-500' : 'border-input'
            }`}
          >
            <input
              type='radio'
              name={content.Label || 'selection'}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                setValue(option.value);
                setIsTouched(true);
              }}
              title={content.Tooltip ?? ''}
              className='w-4 h-4 cursor-pointer'
            />
            <span className='ml-3 text-sm text-foreground'>{option.label}</span>
          </label>
        ))}
      </div>
      {showErrors && (
        <div className='space-y-1'>
          {errorMessages.map(message => (
            <p key={message} className='text-xs text-red-600'>
              {message}
            </p>
          ))}
        </div>
      )}
      {!showErrors && content.Tooltip && (
        <p className='text-xs text-muted-foreground'>{content.Tooltip}</p>
      )}
    </fieldset>
  );
}
