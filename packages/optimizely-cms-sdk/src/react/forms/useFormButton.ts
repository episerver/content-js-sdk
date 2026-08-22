'use client';

import { useFormSubmission } from './FormSubmissionProvider.js';
import { useFormSteps } from './FormWrapper.js';

export type FormButtonRole = 'next' | 'previous' | 'submit';

/**
 * Optimizely Forms has no property marking a button as step navigation: Next,
 * Previous and Submit are all the same element type, told apart only by their
 * label. Override these when the form is authored in another language, or the
 * step buttons will submit instead of navigating.
 *
 * Matching is case-insensitive.
 */
export const DEFAULT_STEP_BUTTON_LABELS: Record<'next' | 'previous', string[]> = {
  next: ['next'],
  previous: ['previous', 'back'],
};

type FormButtonContent = {
  Label?: string | null;
  Tooltip?: string | null;
};

type UseFormButtonOptions = {
  labels?: { next?: string[]; previous?: string[] };
};

const matches = (label: string, candidates: string[]) =>
  candidates.some(candidate => candidate.toLowerCase() === label);

/**
 * Works out what a form button does and wires it up.
 *
 * @returns `buttonProps` to spread onto a `<button>`, plus the `role` so the
 *   template can style back and forward differently.
 */
export function useFormButton(
  content: FormButtonContent,
  options: UseFormButtonOptions = {},
) {
  const { isSubmitting } = useFormSubmission();
  const { nextStep, prevStep } = useFormSteps();

  const label = content.Label?.trim().toLowerCase() ?? '';
  const nextLabels = options.labels?.next ?? DEFAULT_STEP_BUTTON_LABELS.next;
  const previousLabels = options.labels?.previous ?? DEFAULT_STEP_BUTTON_LABELS.previous;

  const role: FormButtonRole =
    matches(label, nextLabels) ? 'next'
    : matches(label, previousLabels) ? 'previous'
    : 'submit';

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
