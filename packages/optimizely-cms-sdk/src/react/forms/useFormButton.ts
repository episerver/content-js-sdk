'use client';

import { useFormSubmission } from './FormSubmissionProvider.js';
import { useFormSteps } from './FormWrapper.js';
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
      type: role === 'submit' ? ('submit' as const) : ('button' as const),
      // Disabled only while the request is in flight, to stop a double submit.
      // Disabling on validation errors hides the reason the form won't send;
      // submitting reports the errors and moves focus to the first bad field.
      disabled: isSubmitting,
      title: content.Tooltip ?? '',
      onClick:
        role === 'next' ? nextStep
        : role === 'previous' ? prevStep
        : undefined,
    },
  };
}
