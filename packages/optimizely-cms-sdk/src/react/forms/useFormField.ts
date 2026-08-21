'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormValidation } from './FormValidationContext.js';
import { useFormRules } from './FormRulesContext.js';
import { useFormStepIndex } from './FormStep.js';
import { getElementId } from './getElementId.js';
import {
  validateField,
  getErrorMessages,
  isFieldRequired,
  getFieldName,
  toValidators,
} from '../../forms/validation.js';
import type { Validator } from '../../forms/validation.js';

/** The element properties this hook reads. Every form field content type has them. */
type FormFieldContent = {
  SubmissionFieldName?: string | null;
  Label?: string | null;
  Validators?: unknown;
  PredefinedValue?: string | null;
};

type UseFormFieldOptions = {
  /** The element's content. Name, validators and initial value are read from it. */
  content?: FormFieldContent & Record<string, unknown>;
  /** Overrides the name derived from `SubmissionFieldName` / `Label`. */
  name?: string;
  /** Overrides the validators read from `Validators`. */
  validators?: Validator[];
  /** Overrides the initial value read from `PredefinedValue`. */
  defaultValue?: string;
};

/**
 * Wires a single form field into validation and dependency rules.
 *
 * A field hidden by a dependency rule is not registered for validation, so a
 * hidden required field cannot block submission.
 *
 * @returns `fieldProps` to spread onto an `<input>` or `<textarea>` and
 *   `errorProps` for the element listing the messages. Controls that can't take
 *   those directly (a radio group, say) can use `inputRef`, `value`, `setValue`,
 *   `onBlur` and `errorId` instead.
 */
export function useFormField<TElement extends HTMLElement = HTMLInputElement>({
  content,
  name: nameOverride,
  validators: validatorsOverride,
  defaultValue,
}: UseFormFieldOptions) {
  const field = content ?? {};
  const name = nameOverride ?? getFieldName(field);
  const validators = validatorsOverride ?? toValidators(field.Validators);

  const initialValue = defaultValue ?? field.PredefinedValue ?? '';
  const [value, setValue] = useState(initialValue);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<TElement>(null);
  const {
    registerField,
    unregisterField,
    setFieldError,
    attemptedSubmit,
    resetToken,
  } = useFormValidation();

  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  useEffect(() => {
    // Skips the first render: the token starts at 0 and only moves on a reset.
    if (resetToken === 0) return;
    setValue(initialValueRef.current);
    setIsTouched(false);
  }, [resetToken]);

  const { setFieldValue, isElementVisible } = useFormRules();
  const stepIndex = useFormStepIndex();
  const elementId = content ? getElementId(content) : undefined;
  const isVisible = !elementId || isElementVisible(elementId);

  const errors = validateField(value, validators);
  const errorMessages = getErrorMessages(errors);
  const hasErrors = errorMessages.length > 0;
  const showErrors = isVisible && (isTouched || attemptedSubmit) && hasErrors;
  const isRequired = isFieldRequired(validators);

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

  const errorId = showErrors ? `${name}-error` : undefined;
  const onBlur = () => setIsTouched(true);

  return {
    value,
    setValue,
    isVisible,
    inputRef,
    onBlur,
    errors: errorMessages,
    showErrors,
    hasErrors,
    isRequired,
    errorId,

    fieldProps: {
      ref: inputRef,
      id: name,
      name,
      value,
      required: isRequired,
      'aria-invalid': showErrors,
      'aria-describedby': errorId,
      // Structural typing keeps this assignable to both an input's and a
      // textarea's onChange without a cast at either call site.
      onChange: (event: { target: { value: string } }) => setValue(event.target.value),
      onBlur,
    },

    errorProps: {
      id: `${name}-error`,
      role: 'alert' as const,
    },
  };
}
