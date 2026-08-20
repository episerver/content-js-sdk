'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

type FormStatusContextType = {
  status: FormStatus;
  setStatus: (status: FormStatus) => void;
  formSuccess: boolean;
  formError: boolean;
  isSubmitting: boolean;
};

const FormStatusContext = createContext<FormStatusContextType | undefined>(undefined);

export function useFormStatus() {
  const context = useContext(FormStatusContext);
  if (!context) {
    throw new Error('useFormStatus must be used within a FormStatusProvider');
  }
  return context;
}

type FormStatusProviderProps = {
  children: ReactNode;
};

export function FormStatusProvider({ children }: FormStatusProviderProps) {
  const [status, setStatus] = useState<FormStatus>('idle');

  return (
    <FormStatusContext.Provider
      value={{
        status,
        setStatus,
        formSuccess: status === 'success',
        formError: status === 'error',
        isSubmitting: status === 'submitting',
      }}
    >
      {children}
    </FormStatusContext.Provider>
  );
}
