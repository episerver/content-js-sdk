/**
 * Shared field styling, so inputs, textareas and selections stay in step with
 * each other and with the rest of the Stride palette (key1 accent, foreground
 * scale).
 */

export const labelClass = 'block text-sm font-semibold text-foreground';

export const requiredMarkClass = 'ml-0.5 text-red-600';

export const helpTextClass = 'text-xs text-foreground2';

export const errorTextClass = 'text-xs text-red-600';

const controlBase =
  'w-full rounded-md border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground2 transition-colors focus:outline-none focus:ring-2';

export const controlClass = (hasError: boolean) =>
  `${controlBase} ${
    hasError ?
      'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-foreground/15 focus:border-key1 focus:ring-key1/30'
  }`;

/** Matches the `Button` element so form buttons don't look like a different site. */
export const buttonBase =
  'cursor-pointer box-border inline-flex w-fit items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const buttonRoleClass = {
  submit: 'border-2 border-key1 bg-key1 text-foreground-inverted focus:ring-key1',
  next: 'border-2 border-key1 bg-key1 text-foreground-inverted focus:ring-key1',
  previous: 'border-2 border-foreground text-foreground focus:ring-foreground/30',
};
