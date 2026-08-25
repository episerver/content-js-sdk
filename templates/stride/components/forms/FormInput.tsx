'use client';

import { ContentProps, OptiFormsTextboxElementContentType } from '@optimizely/cms-sdk';
import {
  getHtmlValidationAttributes,
  toValidators,
} from '@optimizely/cms-sdk/forms/validation';
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

type FormInputProps = {
  content: ContentProps<typeof OptiFormsTextboxElementContentType>;
};

export default function FormInput({ content }: FormInputProps) {
  const { fieldProps, errorProps, errors, showErrors, isRequired } = useFormField({
    content,
  });

  const htmlAttrs = getHtmlValidationAttributes(toValidators(content.Validators));
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
        <input
          {...fieldProps}
          type={(htmlAttrs.type as string) ?? 'text'}
          placeholder={content.Placeholder ?? ''}
          title={content.Tooltip ?? ''}
          {...pa('Placeholder')}
          autoComplete={content.AutoComplete ?? 'off'}
          pattern={htmlAttrs.pattern as string | undefined}
          className={controlClass(showErrors)}
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
