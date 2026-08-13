'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormValidation } from './FormValidationContext.js';
import { useFormRules } from './FormRulesContext.js';
import { getElementId } from './getElementId.js';
import { validateField, getErrorMessages, isFieldRequired } from '../../forms/validation.js';
import type { Validator } from '../../forms/validation.js';

type UseFormFieldOptions = {
  name: string;
  validators?: Validator[];
  defaultValue?: string;
  content?: Record<string, unknown>;
};

export function useFormField({ name, validators = [], defaultValue = '', content }: UseFormFieldOptions) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerField, unregisterField, setFieldError, attemptedSubmit } = useFormValidation();

  const { setFieldValue } = useFormRules();
  const elementId = content ? getElementId(content) : undefined;

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

  useEffect(() => {
    if (elementId) {
      setFieldValue(elementId, value);
    }
  }, [value, elementId, setFieldValue]);

  return {
    value,
    setValue,
    inputRef,
    errors: errorMessages,
    showErrors,
    hasErrors,
    isRequired: isFieldRequired(validators),
  };
}
