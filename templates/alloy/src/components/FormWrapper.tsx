import { FormWrapper as SDKFormWrapper } from '@optimizely/cms-sdk/forms/react';
import { ReactNode } from 'react';

type FormWrapperProps = {
  action: string;
  children: ReactNode;
};

export default function FormWrapper({ action, children }: FormWrapperProps) {
  return (
    <SDKFormWrapper
      action={action}
      scrollToOnSuccess="form-alert"
      scrollToOnError={false}
    >
      {children}
    </SDKFormWrapper>
  );
}
