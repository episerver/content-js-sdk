'use client';

import { useState } from 'react';
import { ContentProps, OptiFormsTextboxElementContentType } from '@optimizely/cms-sdk';
import { validateField, getErrorMessages, isFieldRequired } from '../utils/formValidation';

type FormInputProps = {
  content: ContentProps<typeof OptiFormsTextboxElementContentType>;
};

export default function FormInput({ content }: FormInputProps) {
  const [value, setValue] = useState(content.PredefinedValue ?? '');
  const [isTouched, setIsTouched] = useState(false);

  const validators = (content.Validators as any) ?? [];
  const errors = validateField(value, validators);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = isTouched && hasErrors;
  const required = isFieldRequired(validators);

  return (
    <div className='space-y-2 flex-1'>
      {content.Label && (
        <label className='block text-sm font-medium text-foreground'>
          {content.Label}
          {required && <span className='text-red-600 ml-1'>*</span>}
        </label>
      )}
      <input
        type='text'
        placeholder={content.Placeholder ?? ''}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => setIsTouched(true)}
        title={content.Tooltip ?? ''}
        autoComplete={content.AutoComplete ?? 'off'}
        className={`w-full px-4 py-2 rounded-md border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
          showErrors ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-key1'
        }`}
      />
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
    </div>
  );
}

