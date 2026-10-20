'use client';

import { createContext, useContext, useState, useSyncExternalStore, ReactNode } from 'react';
import {
  createSubmissionStore,
  type SubmissionStore,
} from '../../core/forms/controller.js';

const FormSubmissionContext = createContext<SubmissionStore | undefined>(undefined);

/** The underlying store, for `FormWrapper`, which writes to it rather than reading it. */
export function useFormSubmissionStore() {
  const store = useContext(FormSubmissionContext);
  if (!store) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  return store;
}

export function useFormSubmission() {
  const store = useFormSubmissionStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return { ...state, setStatus: store.setStatus };
}

type FormSubmissionProviderProps = {
  children: ReactNode;
};

export function FormSubmissionProvider({ children }: FormSubmissionProviderProps) {
  const [store] = useState(createSubmissionStore);

  return (
    <FormSubmissionContext.Provider value={store}>{children}</FormSubmissionContext.Provider>
  );
}
