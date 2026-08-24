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

export type FormButtonContent = {
  Label?: string | null;
  Tooltip?: string | null;
};

export type FormButtonLabelOptions = {
  labels?: { next?: string[]; previous?: string[] };
};

const matches = (label: string, candidates: string[]) =>
  candidates.some(candidate => candidate.toLowerCase() === label);

/**
 * What a form button does, from its label alone.
 *
 * Kept free of React so a server component can ask the same question — a footer
 * has to know whether one of its buttons goes back before it can decide how to
 * align them.
 */
export function getFormButtonRole(
  content: FormButtonContent,
  options: FormButtonLabelOptions = {},
): FormButtonRole {
  const label = content.Label?.trim().toLowerCase() ?? '';
  const nextLabels = options.labels?.next ?? DEFAULT_STEP_BUTTON_LABELS.next;
  const previousLabels = options.labels?.previous ?? DEFAULT_STEP_BUTTON_LABELS.previous;

  if (matches(label, nextLabels)) return 'next';
  if (matches(label, previousLabels)) return 'previous';
  return 'submit';
}
