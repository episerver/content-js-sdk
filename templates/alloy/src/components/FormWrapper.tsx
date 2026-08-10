'use client';

import { ReactNode, useRef } from 'react';
import { FormValidationProvider, useFormValidation } from './FormValidationContext';

type FormWrapperProps = {
  action: string;
  children: ReactNode;
};

function FormWrapperContent({ action, children }: FormWrapperProps) {
  const { setAttemptedSubmit, validateAllFields, getFieldRef } = useFormValidation();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAttemptedSubmit(true);

    const allFieldsValid = validateAllFields();

    if (!allFieldsValid) {
      const firstInvalidField = Array.from(
        formRef.current?.querySelectorAll('[data-field-name]') ?? [],
      ).find(field => {
        const fieldName = field.getAttribute('data-field-name');
        return fieldName && !getFieldRef(fieldName);
      });

      if (firstInvalidField && firstInvalidField instanceof HTMLElement) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = firstInvalidField.querySelector('input, textarea, [role="radio"]');
        if (input instanceof HTMLElement) input.focus();
      }

      return;
    }

    setAttemptedSubmit(false);
    formRef.current?.submit();
  };

  return (
    <form ref={formRef} method='POST' action={action} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

export default function FormWrapper({ action, children }: FormWrapperProps) {
  return (
    <FormValidationProvider>
      <FormWrapperContent action={action} children={children} />
    </FormValidationProvider>
  );
}
