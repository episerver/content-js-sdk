'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

type FormSubmissionContextType = {
  status: FormStatus;
  /**
   * Sets the status. An error passed alongside `'error'` becomes available as
   * {@linkcode error} and {@linkcode errorMessage}; any other status clears it.
   */
  setStatus: (status: FormStatus, error?: unknown) => void;
  /** Whatever the failing submit threw, if anything. */
  error: unknown;
  /**
   * The failure's message, ready to render.
   *
   * Only set when a `submitHandler` threw an `Error`. A failed built-in POST
   * leaves this undefined, so a template rendering it cannot put `Failed to
   * fetch` or a bare status code in front of a visitor.
   */
  errorMessage: string | undefined;
  formSuccess: boolean;
  formError: boolean;
  isSubmitting: boolean;
};

const FormSubmissionContext = createContext<FormSubmissionContextType | undefined>(undefined);

export function useFormSubmission() {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  return context;
}

type FormSubmissionProviderProps = {
  children: ReactNode;
};

export function FormSubmissionProvider({ children }: FormSubmissionProviderProps) {
  const [{ status, error }, setState] = useState<{
    status: FormStatus;
    error: unknown;
  }>({ status: 'idle', error: undefined });

  // Held together with the status so a retry cannot leave the previous attempt's
  // message on screen next to a 'submitting' or 'success' state.
  const setStatus = useCallback((next: FormStatus, nextError?: unknown) => {
    setState({ status: next, error: next === 'error' ? nextError : undefined });
  }, []);

  return (
    <FormSubmissionContext.Provider
      value={{
        status,
        setStatus,
        error,
        errorMessage: error instanceof Error ? error.message : undefined,
        formSuccess: status === 'success',
        formError: status === 'error',
        isSubmitting: status === 'submitting',
      }}
    >
      {children}
    </FormSubmissionContext.Provider>
  );
}
