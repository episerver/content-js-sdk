'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormValidation } from './FormValidationContext.js';
import { useFormRules } from './FormRulesContext.js';
import { useFormStepIndex } from './FormStep.js';
import {
  buildFieldProps,
  computeFieldState,
  defineFormField,
  type DefineFormFieldOptions,
} from '../../core/forms/field.js';

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
export function useFormField<TElement extends HTMLElement = HTMLInputElement>(
  options: DefineFormFieldOptions,
) {
  const definition = defineFormField(options);
  const { name, initialValue, elementIds } = definition;

  const [value, setValue] = useState(initialValue);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<TElement>(null);
  const { registerField, unregisterField, setFieldError, attemptedSubmit, resetToken } =
    useFormValidation();

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
  const elementIdKey = elementIds.join('|');
  const elementIdsRef = useRef(elementIds);
  elementIdsRef.current = elementIds;

  const isVisible = elementIds.length === 0 || isElementVisible(elementIds);

  const fieldState = computeFieldState(definition, {
    value,
    isTouched,
    attemptedSubmit,
    isVisible,
  });
  const { errors, hasErrors, showErrors, isRequired, errorId } = fieldState;

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
    if (elementIdKey) setFieldValue(elementIdsRef.current, value);
  }, [value, elementIdKey, setFieldValue]);

  const onBlur = () => setIsTouched(true);
  const { fieldProps, errorProps } = buildFieldProps(definition, fieldState, value);

  return {
    value,
    setValue,
    isVisible,
    inputRef,
    onBlur,
    errors,
    showErrors,
    hasErrors,
    isRequired,
    errorId,

    fieldProps: {
      ...fieldProps,
      ref: inputRef,
      // Structural typing keeps this assignable to both an input's and a
      // textarea's onChange without a cast at either call site.
      onChange: (event: { target: { value: string } }) => setValue(event.target.value),
      onBlur,
    },

    errorProps,
  };
}
