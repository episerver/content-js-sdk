'use client';

import { ContentProps, OptiFormsTextboxElementContentType } from '@optimizely/cms-sdk';
import {
  getHtmlValidationAttributes,
  getFieldName,
  type Validator,
} from '@optimizely/cms-sdk/forms/validation';
import { FormElement, useFormField } from '@optimizely/cms-sdk/forms/react';
import {
  controlClass,
  errorTextClass,
  helpTextClass,
  labelClass,
  requiredMarkClass,
} from './formStyles';

type FormInputProps = {
  content: ContentProps<typeof OptiFormsTextboxElementContentType>;
};

export default function FormInput({ content }: FormInputProps) {
  const validators = (Array.isArray(content.Validators) ? content.Validators : []) as Validator[];
  const fieldName = getFieldName(content);

  const { value, setValue, inputRef, onBlur, errors, showErrors, isRequired } = useFormField({
    name: fieldName,
    validators,
    defaultValue: content.PredefinedValue ?? '',
    content,
  });

  const htmlAttrs = getHtmlValidationAttributes(validators);

  return (
    <FormElement content={content}>
      <div className='flex-1 space-y-1.5'>
        {content.Label && (
          <label htmlFor={fieldName} className={labelClass}>
            {content.Label}
            {isRequired && <span className={requiredMarkClass}>*</span>}
          </label>
        )}
        <input
          ref={inputRef}
          id={fieldName}
          type={(htmlAttrs.type as string) ?? 'text'}
          name={fieldName}
          placeholder={content.Placeholder ?? ''}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
          title={content.Tooltip ?? ''}
          autoComplete={content.AutoComplete ?? 'off'}
          required={htmlAttrs.required === true}
          pattern={htmlAttrs.pattern as string | undefined}
          aria-invalid={showErrors}
          aria-describedby={showErrors ? `${fieldName}-error` : undefined}
          className={controlClass(showErrors)}
        />
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
      </div>
    </FormElement>
  );
}
