'use client';

import { useFormSubmission } from './FormSubmissionProvider.js';
import { useFormSteps } from './FormWrapper.js';
import { buildButtonProps } from '../../core/forms/button.js';
import {
  getFormButtonRole,
  type FormButtonContent,
  type FormButtonLabelOptions,
} from '../../forms/buttonRole.js';

export type { FormButtonRole } from '../../forms/buttonRole.js';
export {
  getFormButtonRole,
  DEFAULT_STEP_BUTTON_LABELS,
} from '../../forms/buttonRole.js';

/**
 * Works out what a form button does and wires it up.
 *
 * @returns `buttonProps` to spread onto a `<button>`, plus the `role` so the
 *   template can style back and forward differently.
 */
export function useFormButton(
  content: FormButtonContent,
  options: FormButtonLabelOptions = {},
) {
  const { isSubmitting } = useFormSubmission();
  const { nextStep, prevStep } = useFormSteps();

  const role = getFormButtonRole(content, options);

  return {
    role,
    isSubmitting,
    label: content.Label ?? 'Submit',
    buttonProps: {
      ...buildButtonProps(role, { isSubmitting, tooltip: content.Tooltip }),
      onClick:
        role === 'next' ? nextStep
        : role === 'previous' ? prevStep
        : undefined,
    },
  };
}
