'use client';

import { createJsonSubmitHandler, FormWrapper } from '@optimizely/cms-sdk/forms/react';
import { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof FormWrapper>, 'submitHandler'>;

export default function FormContainerClient(props: Props) {
  return <FormWrapper submitHandler={createJsonSubmitHandler('/api/forms/submit')} {...props} />;
}
