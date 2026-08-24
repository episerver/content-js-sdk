'use client';

import { ContentProps, OptiFormsTextareaElementContentType } from '@optimizely/cms-sdk';
import {
  FormElement,
  getPreviewUtils,
  useFormField,
} from '@optimizely/cms-sdk/forms/react';
import {
  controlClass,
  errorTextClass,
  helpTextClass,
  labelClass,
  requiredMarkClass,
} from './formStyles';

type FormTextareaProps = {
  content: ContentProps<typeof OptiFormsTextareaElementContentType>;
};

export default function FormTextarea({ content }: FormTextareaProps) {
  const { fieldProps, errorProps, errors, showErrors, isRequired } =
    useFormField<HTMLTextAreaElement>({ content });

  const { pa } = getPreviewUtils(content);

  return (
    <FormElement content={content}>
      <div className='flex-1 space-y-1.5'>
        {content.Label && (
          <label htmlFor={fieldProps.id} className={labelClass} {...pa('Label')}>
            {content.Label}
            {isRequired && <span className={requiredMarkClass}>*</span>}
          </label>
        )}
        <textarea
          {...fieldProps}
          rows={4}
          placeholder={content.Placeholder ?? ''}
          title={content.Tooltip ?? ''}
          autoComplete={content.AutoComplete ?? 'off'}
          className={`${controlClass(showErrors)} resize-y`}
        />
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
          <p className={helpTextClass}>{content.Tooltip}</p>
        )}
      </div>
    </FormElement>
  );
}
