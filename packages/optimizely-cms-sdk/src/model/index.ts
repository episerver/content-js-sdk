import { AnyContentType } from './contentTypes';
import { DisplayTemplate } from './displayTemplates';

/** Defines a Optimizely CMS content type */
export function contentType<T extends AnyContentType>(
  options: T
): T & { __type: 'contentType' } {
  return { ...options, __type: 'contentType' };
}

/** Defines a Optimizely CMS display template */
export function displayTemplate<T extends DisplayTemplate>(
  options: T
): T & { __type: 'displayTemplate' } {
  return { ...options, __type: 'displayTemplate' };
}

/**
 * Checks if `obj` is a content type.
 */
export function isContentType(obj: unknown): obj is AnyContentType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    (obj as any).__type === 'contentType' &&
    'key' in obj
  );
}

/**
 * Checks if `obj` is a display template.
 */
export function isDisplayTemplate(obj: unknown): obj is DisplayTemplate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    (obj as any).__type === 'displayTemplate' &&
    'key' in obj
  );
}
