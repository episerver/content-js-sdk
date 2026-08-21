'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useFormSteps } from './FormWrapper.js';

/**
 * The step a field belongs to, or `undefined` for fields outside any step.
 * Fields read this so that advancing a step only validates that step.
 */
const FormStepIndexContext = createContext<number | undefined>(undefined);

export const useFormStepIndex = () => useContext(FormStepIndexContext);

type FormStepProps = {
  index: number;
  children: ReactNode;
};

/**
 * Renders one step of a multi-step form. Only the active step is visible.
 *
 * Inactive steps stay mounted behind `display: none` so that values already
 * entered survive stepping backwards and forwards, and so that submitting
 * validates every field rather than only the ones on screen.
 */
export function FormStep({ index, children }: FormStepProps) {
  const { currentStepIndex } = useFormSteps();

  return (
    <FormStepIndexContext.Provider value={index}>
      <div style={{ display: currentStepIndex === index ? 'block' : 'none' }}>
        {children}
      </div>
    </FormStepIndexContext.Provider>
  );
}
