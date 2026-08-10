'use client';

import { ReactNode, useRef } from 'react';
import { FormValidationProvider, useFormValidation } from './FormValidationContext';
import { useFormStatus } from './FormStatusProvider';

type FormWrapperProps = {
  action: string;
  children: ReactNode;
};

function FormWrapperContent({ action, children }: FormWrapperProps) {
  const { setAttemptedSubmit, validateAllFields, getFieldRef } = useFormValidation();
  const { setFormSuccess, setFormError, setIsSubmitting } = useFormStatus();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
    setIsSubmitting(true);

    try {
      const formData = new FormData(formRef.current!);
      const response = await fetch(action, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setFormSuccess(true);
        formRef.current?.reset();
        setAttemptedSubmit(false);
        const alertElement = document.getElementById('form-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        setFormError(true);
      }
    } catch (error) {
      setFormError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
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
