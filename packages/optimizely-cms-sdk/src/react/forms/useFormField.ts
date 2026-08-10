'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormValidation } from './FormValidationContext.js';
import { validateField, getErrorMessages } from '../../forms/validation.js';
import type { Validator } from '../../forms/validation.js';

type UseFormFieldOptions = {
  name: string;
  validators?: Validator[];
  defaultValue?: string;
};

export function useFormField({ name, validators = [], defaultValue = '' }: UseFormFieldOptions) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerField, unregisterField, setFieldError, attemptedSubmit } = useFormValidation();

  const errors = validateField(value, validators);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = (attemptedSubmit || false) && hasErrors;

  useEffect(() => {
    const validate = () => !hasErrors;
    registerField(name, inputRef.current, validate);
    setFieldError(name, hasErrors);
    return () => unregisterField(name);
  }, [hasErrors, name, registerField, unregisterField, setFieldError, attemptedSubmit]);

  return {
    value,
    setValue,
    inputRef,
    errors: errorMessages,
    showErrors,
    hasErrors,
    isRequired: validators.some(v => v.type?.toLowerCase() === 'requirevalidator'),
  };
}
