'use client';

import { ContentProps, OptiFormsRangeElementContentType } from '@optimizely/cms-sdk';
import {
  FormElement,
  getPreviewUtils,
  useFormField,
} from '@optimizely/cms-sdk/forms/react';
import {
  helpTextClass,
  labelClass,
} from './formStyles';

type FormRangeProps = {
  content: ContentProps<typeof OptiFormsRangeElementContentType>;
};

export default function FormRange({ content }: FormRangeProps) {
  const { fieldProps, value } = useFormField({
    content,
    defaultValue: content.PredefinedValue ?? String(content.Min ?? 0),
  });

  const { pa } = getPreviewUtils(content);

  return (
    <FormElement content={content}>
      <div className='flex-1 space-y-1.5'>
        {content.Label && (
          <label htmlFor={fieldProps.id} className={labelClass} {...pa('Label')}>
            {content.Label}
          </label>
        )}
        <div className='flex items-center gap-3'>
          <span className='text-sm text-foreground2'>{content.Min ?? 0}</span>
          <input
            {...fieldProps}
            type='range'
            min={content.Min ?? 0}
            max={content.Max ?? 100}
            step={content.Increment ?? 1}
            title={content.Tooltip ?? ''}
            className='w-full accent-key1'
          />
          <span className='text-sm text-foreground2'>{content.Max ?? 100}</span>
        </div>
        <p className='text-sm text-foreground font-medium text-center'>{value}</p>
        {content.Tooltip && (
          <p className={helpTextClass} {...pa('Tooltip')}>
            {content.Tooltip}
          </p>
        )}
      </div>
    </FormElement>
  );
}
