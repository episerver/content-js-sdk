'use client';

import { createContext, useContext } from 'react';

type FormStatusContextType = {
  formSuccess: boolean;
  formError: boolean;
};

const FormStatusContext = createContext<FormStatusContextType>({
  formSuccess: false,
  formError: false,
});

export function useFormStatus() {
  return useContext(FormStatusContext);
}

type FormStatusProviderProps = {
  formSuccess: boolean;
  formError: boolean;
  children: React.ReactNode;
};

export function FormStatusProvider({ formSuccess, formError, children }: FormStatusProviderProps) {
  return (
    <FormStatusContext.Provider value={{ formSuccess, formError }}>
      {children}
    </FormStatusContext.Provider>
  );
}
