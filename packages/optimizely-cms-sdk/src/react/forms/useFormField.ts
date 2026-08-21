'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormValidation } from './FormValidationContext.js';
import { useFormRules } from './FormRulesContext.js';
import { useFormStepIndex } from './FormStep.js';
import { getElementId } from './getElementId.js';
import { validateField, getErrorMessages, isFieldRequired } from '../../forms/validation.js';
import type { Validator } from '../../forms/validation.js';

type UseFormFieldOptions = {
  name: string;
  validators?: Validator[];
  defaultValue?: string;
  content?: Record<string, unknown>;
};

/**
 * Wires a single form field into validation and dependency rules.
 *
 * A field hidden by a dependency rule is not registered for validation, so a
 * hidden required field cannot block submission. Attach `ref` to the element
 * that should be scrolled to and focused when validation fails.
 */
export function useFormField<TElement extends HTMLElement = HTMLInputElement>({
  name,
  validators = [],
  defaultValue = '',
  content,
}: UseFormFieldOptions) {
  const [value, setValue] = useState(defaultValue);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<TElement>(null);
  const { registerField, unregisterField, setFieldError, attemptedSubmit } =
    useFormValidation();

  const { setFieldValue, isElementVisible } = useFormRules();
  const stepIndex = useFormStepIndex();
  const elementId = content ? getElementId(content) : undefined;
  const isVisible = !elementId || isElementVisible(elementId);

  const errors = validateField(value, validators);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = isVisible && (isTouched || attemptedSubmit) && hasErrors;

  useEffect(() => {
    // A field hidden by a rule takes no part in validation. Without this, an
    // untouched hidden required field keeps `hasAnyErrors` true forever and the
    // submit button stays disabled with no error anywhere on screen.
    if (!isVisible) {
      unregisterField(name);
      return;
    }

    registerField(name, inputRef.current, () => !hasErrors, stepIndex);
    setFieldError(name, hasErrors);
    return () => unregisterField(name);
  }, [
    isVisible,
    hasErrors,
    name,
    stepIndex,
    registerField,
    unregisterField,
    setFieldError,
  ]);

  useEffect(() => {
    if (elementId) {
      setFieldValue(elementId, value);
    }
  }, [value, elementId, setFieldValue]);

  return {
    value,
    setValue,
    isVisible,
    inputRef,
    onBlur: () => setIsTouched(true),
    errors: errorMessages,
    showErrors,
    hasErrors,
    isRequired: isFieldRequired(validators),
  };
}
