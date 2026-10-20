/**
 * What a form button does, and the attributes that follow from it.
 *
 * @module
 */

import type { FormButtonRole } from '../../forms/buttonRole.js';

/** The attributes that belong on the `<button>`, minus the click handler. */
export function buildButtonProps(
  role: FormButtonRole,
  context: { isSubmitting: boolean; tooltip?: string | null },
) {
  return {
    type:
      role === 'submit' ? ('submit' as const)
      : role === 'reset' ? ('reset' as const)
      : ('button' as const),
    // Disabled only while the request is in flight, to stop a double submit.
    // Disabling on validation errors hides the reason the form won't send;
    // submitting reports the errors and moves focus to the first bad field.
    disabled: context.isSubmitting,
    title: context.tooltip ?? '',
  };
}
