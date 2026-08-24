'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type FormValidationContextType = {
  attemptedSubmit: boolean;
  setAttemptedSubmit: (value: boolean) => void;
  registerField: (
    name: string,
    ref: HTMLElement | null,
    validate: () => boolean,
    stepIndex?: number,
  ) => void;
  unregisterField: (name: string) => void;
  setFieldError: (name: string, hasError: boolean) => void;
  getFieldRef: (name: string) => HTMLElement | null;
  /** The step a field was registered on, or `undefined` if it is not in a step. */
  getFieldStepIndex: (name: string) => number | undefined;
  /**
   * Runs the registered fields' validators.
   *
   * @param options.stepIndex Validate only the fields on this step. Omit to
   *   validate the whole form, including steps that are not on screen.
   * @returns The names of the fields that failed, in registration order.
   *   Empty means everything validated passed.
   */
  validateAllFields: (options?: { stepIndex?: number }) => string[];
  hasAnyErrors: boolean;
  /**
   * Increments when the form is reset. Fields watch it and return to their
   * initial value: the inputs are controlled, so `form.reset()` clears the DOM
   * but leaves React state holding the old values.
   */
  resetToken: number;
  resetFields: () => void;
};

const FormValidationContext = createContext<FormValidationContextType | undefined>(undefined);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [fieldsWithErrors, setFieldsWithErrors] = useState<Set<string>>(new Set());
  const fieldsRef = useRef<
    Map<string, { ref: HTMLElement | null; validate: () => boolean; stepIndex?: number }>
  >(new Map());

  const updateFieldsWithErrors = useCallback(
    (mutate: (set: Set<string>) => void) => {
      setFieldsWithErrors(prev => {
        const next = new Set(prev);
        mutate(next);
        return next;
      });
    },
    [],
  );

  // Page order, remembered separately from the field map. A field re-registers
  // every time its validity flips, and the cleanup deletes it first, so map
  // insertion order drifts away from the order the fields appear in.
  const fieldOrderRef = useRef<Map<string, number>>(new Map());
  const nextOrderRef = useRef(0);

  const registerField = useCallback(
    (name: string, ref: HTMLElement | null, validate: () => boolean, stepIndex?: number) => {
      if (!fieldOrderRef.current.has(name)) {
        fieldOrderRef.current.set(name, nextOrderRef.current++);
      }
      fieldsRef.current.set(name, { ref, validate, stepIndex });
    },
    [],
  );

  const unregisterField = useCallback(
    (name: string) => {
      fieldsRef.current.delete(name);
      updateFieldsWithErrors(set => set.delete(name));
    },
    [updateFieldsWithErrors],
  );

  const setFieldError = useCallback(
    (name: string, hasError: boolean) => {
      updateFieldsWithErrors(set => {
        if (hasError) set.add(name);
        else set.delete(name);
      });
    },
    [updateFieldsWithErrors],
  );

  const getFieldRef = useCallback((name: string): HTMLElement | null => {
    return fieldsRef.current.get(name)?.ref ?? null;
  }, []);

  const getFieldStepIndex = useCallback((name: string): number | undefined => {
    return fieldsRef.current.get(name)?.stepIndex;
  }, []);

  const resetFields = useCallback(() => setResetToken(token => token + 1), []);

  const validateAllFields = useCallback(
    ({ stepIndex }: { stepIndex?: number } = {}): string[] => {
      const invalid: string[] = [];
      fieldsRef.current.forEach((field, name) => {
        if (stepIndex !== undefined && field.stepIndex !== stepIndex) return;
        if (!field.validate()) invalid.push(name);
      });

      const orderOf = (name: string) => fieldOrderRef.current.get(name) ?? 0;
      return invalid.sort((a, b) => orderOf(a) - orderOf(b));
    },
    [],
  );

  return (
    <FormValidationContext.Provider
      value={{
        attemptedSubmit,
        setAttemptedSubmit,
        registerField,
        unregisterField,
        setFieldError,
        getFieldRef,
        getFieldStepIndex,
        validateAllFields,
        hasAnyErrors: fieldsWithErrors.size > 0,
        resetToken,
        resetFields,
      }}
    >
      {children}
    </FormValidationContext.Provider>
  );
}

export function useFormValidation() {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidation must be used within a FormValidationProvider');
  }
  return context;
}
