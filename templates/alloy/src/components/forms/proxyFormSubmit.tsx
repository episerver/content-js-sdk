'use client';

import { ComponentProps } from 'react';
import { FormWrapper } from '@optimizely/cms-sdk/forms/react';
import type { FormSubmitHandler } from '@optimizely/cms-sdk/forms/react';

const proxyFormSubmit: FormSubmitHandler = async (formData, { action }) => {
  if (action) {
    formData.append('__submitUrl', action);
  }

  const response = await fetch('/api/forms/submit', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Submission failed with status ${response.status}`);
  }
};

type ProxiedFormWrapperProps = Omit<ComponentProps<typeof FormWrapper>, 'submitHandler'>;

export function ProxiedFormWrapper(props: ProxiedFormWrapperProps) {
  return <FormWrapper {...props} submitHandler={proxyFormSubmit} />;
}
