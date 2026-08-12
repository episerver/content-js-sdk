'use client';

import { ReactNode } from 'react';
import { useFormSteps } from './FormWrapper.js';

type FormStepProps = {
  index: number;
  children: ReactNode;
};

export function FormStep({ index, children }: FormStepProps) {
  const { currentStepIndex } = useFormSteps();
  if (currentStepIndex !== index) return null;
  return children;
}
