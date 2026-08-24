'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

type FormSubmissionContextType = {
  status: FormStatus;
  setStatus: (status: FormStatus) => void;
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
  const [status, setStatus] = useState<FormStatus>('idle');

  return (
    <FormSubmissionContext.Provider
      value={{
        status,
        setStatus,
        formSuccess: status === 'success',
        formError: status === 'error',
        isSubmitting: status === 'submitting',
      }}
    >
      {children}
    </FormSubmissionContext.Provider>
  );
}
