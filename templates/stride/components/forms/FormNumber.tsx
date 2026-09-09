'use client';

import { ContentProps, OptiFormsNumberElementContentType } from '@optimizely/cms-sdk';
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

type FormNumberProps = {
  content: ContentProps<typeof OptiFormsNumberElementContentType>;
};

export default function FormNumber({ content }: FormNumberProps) {
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
          type='number'
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
          <p className={helpTextClass} {...pa('Tooltip')}>
            {content.Tooltip}
          </p>
        )}
      </div>
    </FormElement>
  );
}
