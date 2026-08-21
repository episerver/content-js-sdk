'use client';

import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';
import { getFieldName, type Validator } from '@optimizely/cms-sdk/forms/validation';
import { FormElement, useFormField } from '@optimizely/cms-sdk/forms/react';
import {
  errorTextClass,
  helpTextClass,
  labelClass,
  requiredMarkClass,
} from './formStyles';

type FormSelectionProps = {
  content: ContentProps<typeof OptiFormsSelectionElementContentType>;
};

type SelectionOption = {
  label: string;
  value: string;
  selected?: boolean;
};

export default function FormSelection({ content }: FormSelectionProps) {
  const options = (Array.isArray(content.Options) ? content.Options : []) as SelectionOption[];
  const validators = (Array.isArray(content.Validators) ? content.Validators : []) as Validator[];
  const fieldName = getFieldName(content);

  const { value, setValue, inputRef, onBlur, errors, showErrors, isRequired } =
    useFormField<HTMLFieldSetElement>({
      name: fieldName,
      validators,
      defaultValue: options.find(opt => opt.selected)?.value ?? '',
      content,
    });

  return (
    <FormElement content={content}>
      <fieldset ref={inputRef} className='flex-1 space-y-2'>
        {content.Label && (
          <legend className={labelClass}>
            {content.Label}
            {isRequired && <span className={requiredMarkClass}>*</span>}
          </legend>
        )}
        <div className='grid gap-2 sm:grid-cols-2'>
          {options.map(option => {
            const isSelected = value === option.value;

            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center rounded-md border bg-white px-3.5 py-2.5 transition-colors ${
                  showErrors ? 'border-red-500'
                  : isSelected ? 'border-teal-500 ring-1 ring-teal-500/30'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type='radio'
                  name={fieldName}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => {
                    setValue(option.value);
                    onBlur();
                  }}
                  title={content.Tooltip ?? ''}
                  aria-invalid={showErrors}
                  aria-describedby={showErrors ? `${fieldName}-error` : undefined}
                  className='h-4 w-4 cursor-pointer accent-teal-500'
                />
                <span className='ml-3 text-sm text-gray-900'>{option.label}</span>
              </label>
            );
          })}
        </div>
        {showErrors && (
          <div className='space-y-1' id={`${fieldName}-error`} role='alert'>
            {errors.map(message => (
              <p key={message} className={errorTextClass}>
                {message}
              </p>
            ))}
          </div>
        )}
        {!showErrors && content.Tooltip && (
          <p className={helpTextClass}>{content.Tooltip}</p>
        )}
      </fieldset>
    </FormElement>
  );
}
