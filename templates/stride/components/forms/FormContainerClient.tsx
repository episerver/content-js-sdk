'use client';

import { createJsonSubmitHandler, FormWrapper } from '@optimizely/cms-sdk/forms/react';
import { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof FormWrapper>, 'submitHandler'> & {
  formKey?: string;
};

export default function FormContainerClient({ formKey, ...props }: Props) {
  return <FormWrapper submitHandler={createJsonSubmitHandler('/api/forms/submit', formKey)} {...props} />;
}
