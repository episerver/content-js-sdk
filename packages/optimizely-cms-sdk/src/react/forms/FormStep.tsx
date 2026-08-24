'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useFormSteps } from './FormWrapper.js';
import { getPreviewUtils } from '../previewUtils.js';

/**
 * The step a field belongs to, or `undefined` for fields outside any step.
 * Fields read this so that advancing a step only validates that step.
 */
const FormStepIndexContext = createContext<number | undefined>(undefined);

export const useFormStepIndex = () => useContext(FormStepIndexContext);

type FormStepProps = {
  index: number;
  /**
   * The composition node this step renders.
   *
   * Optional, but pass it in edit mode so the CMS editor can highlight this step.
   */
  node?: {
    key: string;
    __context?: {
      edit: boolean;
      preview_token: string;
    };
  };
  children: ReactNode;
};

/**
 * Renders one step of a multi-step form. Only the active step is visible.
 *
 * Inactive steps stay mounted behind `display: none` so that values already
 * entered survive stepping backwards and forwards, and so that submitting
 * validates every field rather than only the ones on screen.
 */
export function FormStep({ index, node, children }: FormStepProps) {
  const { currentStepIndex } = useFormSteps();
  const { pa } = getPreviewUtils(node ?? {});

  return (
    <FormStepIndexContext.Provider value={index}>
      <div
        style={{ display: currentStepIndex === index ? 'block' : 'none' }}
        {...(node ? pa(node) : {})}
      >
        {children}
      </div>
    </FormStepIndexContext.Provider>
  );
}
