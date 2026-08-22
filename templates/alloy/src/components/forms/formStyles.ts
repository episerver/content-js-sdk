/**
 * Shared field styling, so inputs, textareas and selections stay in step with
 * each other and with the rest of the Alloy palette (teal accent, gray scale).
 */

export const labelClass = 'block text-sm font-medium text-gray-900';

export const requiredMarkClass = 'ml-0.5 text-red-600';

export const helpTextClass = 'text-xs text-gray-500';

export const errorTextClass = 'text-xs text-red-600';

const controlBase =
  'w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2';

export const controlClass = (hasError: boolean) =>
  `${controlBase} ${
    hasError ?
      'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/30'
  }`;
