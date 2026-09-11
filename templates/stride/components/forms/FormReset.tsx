'use client';

import { ContentProps, OptiFormsResetElementContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, useFormButton } from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../lib/utils';
import { buttonBase, buttonRoleClass } from './formStyles';

type FormResetProps = {
  content: ContentProps<typeof OptiFormsResetElementContentType>;
};

export default function FormReset({ content }: FormResetProps) {
  const { role, label, buttonProps } = useFormButton(content, { role: 'reset' });
  const { pa } = getPreviewUtils(content);

  return (
    <button {...buttonProps} className={cn(buttonBase, buttonRoleClass[role] ?? buttonRoleClass.previous)}>
      <span {...pa('Label')}>{label}</span>
    </button>
  );
}
