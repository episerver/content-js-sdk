'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentProps, OptiFormsTextareaElementContentType } from '@optimizely/cms-sdk';
import { validateField, getErrorMessages, isFieldRequired, getFieldName } from '../utils/formValidation';
import { useFormValidation } from './FormValidationContext';

type FormTextareaProps = {
  content: ContentProps<typeof OptiFormsTextareaElementContentType>;
};

export default function FormTextarea({ content }: FormTextareaProps) {
  const [value, setValue] = useState(content.PredefinedValue ?? '');
  const [isTouched, setIsTouched] = useState(false);
  const { attemptedSubmit, registerField, unregisterField, setFieldError } = useFormValidation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldName = getFieldName(content.SubmissionFieldName, content.Label);

  const validators = (Array.isArray(content.Validators) ? content.Validators : []) as any[];
  const errors = validateField(value, validators);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = (isTouched || attemptedSubmit) && hasErrors;
  const required = isFieldRequired(validators);

  useEffect(() => {
    const validate = () => !hasErrors;
    registerField(fieldName, textareaRef.current, validate);
    setFieldError(fieldName, hasErrors);
    return () => unregisterField(fieldName);
  }, [hasErrors, fieldName, registerField, unregisterField, setFieldError]);

  return (
    <div className='space-y-2 flex-1' data-field-name={fieldName}>
      {content.Label && (
        <label className='block text-sm font-medium text-foreground'>
          {content.Label}
          {required && <span className='text-red-600 ml-1'>*</span>}
        </label>
      )}
      <textarea
        ref={textareaRef}
        name={fieldName}
        placeholder={content.Placeholder ?? ''}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => setIsTouched(true)}
        title={content.Tooltip ?? ''}
        autoComplete={content.AutoComplete ?? 'off'}
        rows={4}
        required={required}
        aria-invalid={showErrors}
        aria-describedby={showErrors ? `${fieldName}-error` : undefined}
        className={`w-full px-4 py-2 rounded-md border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 resize-vertical ${
          showErrors ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-key1'
        }`}
      />
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
    </div>
  );
}

