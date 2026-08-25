'use client';

import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';
import { getSelectionOptions } from '@optimizely/cms-sdk/forms/validation';
import {
  FormElement,
  getPreviewUtils,
  useFormField,
} from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../lib/utils';
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
  const {
    value,
    setValue,
    inputRef,
    onBlur,
    errorId,
    errorProps,
    errors,
    showErrors,
    isRequired,
  } = useFormField<HTMLFieldSetElement>({
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
                className={cn(
                  'flex cursor-pointer items-center rounded-md border bg-background px-4 py-3 transition-colors',
                  showErrors ? 'border-red-500'
                  : isSelected ? 'border-key1 ring-1 ring-key1/30'
                  : 'border-foreground/15 hover:border-foreground/30 hover:bg-background2',
                )}
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
                  className='h-4 w-4 cursor-pointer accent-key1'
                />
                <span className='ml-3 text-sm text-foreground'>{option.label}</span>
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
