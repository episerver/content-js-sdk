'use client';

import { ContentProps, OptiFormsChoiceElementContentType } from '@optimizely/cms-sdk';
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

type FormChoiceProps = {
  content: ContentProps<typeof OptiFormsChoiceElementContentType>;
};

export default function FormChoice({ content }: FormChoiceProps) {
  const options = getSelectionOptions(content);
  const isMulti = content.AllowMultiSelect === true;

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
    defaultValue: isMulti
      ? options.filter(o => o.selected).map(o => o.value).join(',')
      : options.find(o => o.selected)?.value ?? '',
  });

  const selectedValues = isMulti ? value.split(',').filter(Boolean) : [value];

  function toggleValue(optionValue: string) {
    if (isMulti) {
      const current = value.split(',').filter(Boolean);
      const next = current.includes(optionValue)
        ? current.filter(v => v !== optionValue)
        : [...current, optionValue];
      setValue(next.join(','));
    } else {
      setValue(optionValue);
    }
    onBlur();
  }

  const { pa } = getPreviewUtils(content);
  const inputType = isMulti ? 'checkbox' : 'radio';

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
            const isSelected = selectedValues.includes(option.value);

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
                  type={inputType}
                  name={content.SubmissionFieldName ?? content.Label ?? ''}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => toggleValue(option.value)}
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
