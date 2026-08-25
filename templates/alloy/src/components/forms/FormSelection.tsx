'use client';

import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';
import { getSelectionOptions } from '@optimizely/cms-sdk/forms/validation';
import {
  FormElement,
  getPreviewUtils,
  useFormField,
} from '@optimizely/cms-sdk/forms/react';
import {
  errorTextClass,
  helpTextClass,
  labelClass,
  requiredMarkClass,
} from './formStyles';

type FormSelectionProps = {
  content: ContentProps<typeof OptiFormsSelectionElementContentType>;
};

export default function FormSelection({ content }: FormSelectionProps) {
  const options = getSelectionOptions(content);

  // A radio group can't take `fieldProps`: the name and change handler belong on
  // each radio, and the ref goes on the fieldset that wraps them.
  const { value, setValue, inputRef, onBlur, errorId, errorProps, errors, showErrors, isRequired } =
    useFormField<HTMLFieldSetElement>({
      content,
      defaultValue: options.find(option => option.selected)?.value ?? '',
    });

  const { pa } = getPreviewUtils(content);

  return (
    <FormElement content={content}>
      <fieldset ref={inputRef} className='flex-1 space-y-2'>
        {content.Label && (
          <legend className={labelClass} {...pa('Label')}>
            {content.Label}
            {isRequired && <span className={requiredMarkClass}>*</span>}
          </legend>
        )}
        <div className='grid gap-2 sm:grid-cols-2' {...pa('Options')}>
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
                  name={content.SubmissionFieldName ?? content.Label ?? ''}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => {
                    setValue(option.value);
                    onBlur();
                  }}
                  title={content.Tooltip ?? ''}
                  aria-invalid={showErrors}
                  aria-describedby={errorId}
                  className='h-4 w-4 cursor-pointer accent-teal-500'
                />
                <span className='ml-3 text-sm text-gray-900'>{option.label}</span>
              </label>
            );
          })}
        </div>
        {showErrors && (
          <div {...errorProps} className='space-y-1'>
            {errors.map(message => (
              <p key={message} className={errorTextClass}>
                {message}
              </p>
            ))}
          </div>
        )}
        {!showErrors && content.Tooltip && (
          <p className={helpTextClass} {...pa('Tooltip')}>
            {content.Tooltip}
          </p>
        )}
      </fieldset>
    </FormElement>
  );
}
