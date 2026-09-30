'use client';

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  ReactNode,
} from 'react';
import {
  createFormController,
  createSubmissionStore,
  type FormController,
} from '../../core/forms/controller.js';

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

const FormControllerContext = createContext<FormController | undefined>(undefined);

/** Puts an existing controller in context. `FormWrapper` owns the one it creates. */
export const FormControllerProvider = FormControllerContext.Provider;

/**
 * Creates a controller with no submission target.
 *
 * `FormWrapper` provides its own, so this is for fields mounted outside one.
 */
export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() =>
    createFormController({ submission: createSubmissionStore() }),
  );

  return (
    <FormControllerProvider value={controller}>{children}</FormControllerProvider>
  );
}

export function useFormValidation(): FormValidationContextType {
  const controller = useContext(FormControllerContext);
  if (!controller) {
    throw new Error('useFormValidation must be used within a FormValidationProvider');
  }

  const { attemptedSubmit, hasAnyErrors, resetToken } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  return {
    attemptedSubmit,
    hasAnyErrors,
    resetToken,
    setAttemptedSubmit: controller.setAttemptedSubmit,
    registerField: controller.registerField,
    unregisterField: controller.unregisterField,
    setFieldError: controller.setFieldError,
    getFieldRef: controller.getFieldRef,
    getFieldStepIndex: controller.getFieldStepIndex,
    validateAllFields: controller.validateAllFields,
    resetFields: controller.resetFields,
  };
}
