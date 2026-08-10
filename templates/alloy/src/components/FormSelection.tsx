'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';
import { validateField, getErrorMessages, isFieldRequired, getFieldName } from '../utils/formValidation';
import { useFormValidation } from './FormValidationContext';

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
  const { attemptedSubmit, registerField, unregisterField, setFieldError } = useFormValidation();
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const fieldName = getFieldName(content.SubmissionFieldName, content.Label);

  const validators = (Array.isArray(content.Validators) ? content.Validators : []) as any[];
  const errors = validateField(value, validators);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = (isTouched || attemptedSubmit) && hasErrors;
  const required = isFieldRequired(validators);

  useEffect(() => {
    const validate = () => !hasErrors;
    registerField(fieldName, fieldsetRef.current, validate);
    setFieldError(fieldName, hasErrors);
    return () => unregisterField(fieldName);
  }, [hasErrors, fieldName, registerField, unregisterField, setFieldError]);

  return (
    <fieldset ref={fieldsetRef} className='space-y-3 flex-1' data-field-name={fieldName}>
      {content.Label && (
        <legend className='text-sm font-medium text-foreground'>
          {content.Label}
          {required && <span className='text-red-600 ml-1'>*</span>}
        </legend>
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
              name={fieldName}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                setValue(option.value);
                setIsTouched(true);
              }}
              title={content.Tooltip ?? ''}
              aria-invalid={showErrors}
              aria-describedby={showErrors ? `${fieldName}-error` : undefined}
              className='w-4 h-4 cursor-pointer'
            />
            <span className='ml-3 text-sm text-foreground'>{option.label}</span>
          </label>
        ))}
      </div>
      {showErrors && (
        <div className='space-y-1' id={`${fieldName}-error`} role='alert'>
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
