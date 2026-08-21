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
};

const FormValidationContext = createContext<FormValidationContextType | undefined>(undefined);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
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

  const registerField = useCallback(
    (name: string, ref: HTMLElement | null, validate: () => boolean, stepIndex?: number) => {
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

  const validateAllFields = useCallback(
    ({ stepIndex }: { stepIndex?: number } = {}): string[] => {
      const invalid: string[] = [];
      fieldsRef.current.forEach((field, name) => {
        if (stepIndex !== undefined && field.stepIndex !== stepIndex) return;
        if (!field.validate()) invalid.push(name);
      });
      return invalid;
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
        validateAllFields,
        hasAnyErrors: fieldsWithErrors.size > 0,
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
