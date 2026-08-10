'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type FormStatusContextType = {
  formSuccess: boolean;
  formError: boolean;
  isSubmitting: boolean;
  setFormSuccess: (value: boolean) => void;
  setFormError: (value: boolean) => void;
  setIsSubmitting: (value: boolean) => void;
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
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <FormStatusContext.Provider
      value={{
        formSuccess,
        formError,
        isSubmitting,
        setFormSuccess,
        setFormError,
        setIsSubmitting,
      }}
    >
      {children}
    </FormStatusContext.Provider>
  );
}
