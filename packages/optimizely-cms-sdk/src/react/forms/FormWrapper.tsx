'use client';

import { ReactNode, useRef } from 'react';
import { FormValidationProvider, useFormValidation } from './FormValidationContext.js';
import { useFormStatus } from './FormStatusProvider.js';

type FormWrapperProps = {
  action: string;
  children: ReactNode;
  scrollToOnSuccess?: string | false;
  scrollToOnError?: string | false;
};

function FormWrapperContent({
  action,
  children,
  scrollToOnSuccess = 'form-alert',
  scrollToOnError,
}: FormWrapperProps) {
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

      if (scrollToOnError) {
        const errorElement = document.getElementById(scrollToOnError);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

        if (scrollToOnSuccess) {
          const alertElement = document.getElementById(scrollToOnSuccess);
          if (alertElement) {
            alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
        setFormError(true);

        if (scrollToOnError) {
          const errorElement = document.getElementById(scrollToOnError);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    } catch (error) {
      setFormError(true);

      if (scrollToOnError) {
        const errorElement = document.getElementById(scrollToOnError);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
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

export default function FormWrapper(props: FormWrapperProps) {
  return (
    <FormValidationProvider>
      <FormWrapperContent {...props} />
    </FormValidationProvider>
  );
}
