'use client';

import { ReactNode } from 'react';
import { useFormStep } from '@optimizely/cms-sdk/forms/react';

type FormStepContainerProps = {
  index: number;
  children: ReactNode;
};

export default function FormStepContainer({ index, children }: FormStepContainerProps) {
  const { currentStepIndex } = useFormStep();
  const isVisible = currentStepIndex === index;

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {children}
    </div>
  );
}
