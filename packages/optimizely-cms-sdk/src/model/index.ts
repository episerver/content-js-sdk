import { BuildConfig } from './buildConfig';
import { AnyContentType } from './contentTypes';
import { DisplayTemplate } from './displayTemplates';

/** Defines a Optimizely CMS content type */
export function contentType<T extends AnyContentType>(
  options: T
): T & { __type: 'contentType' } {
  if (isValidKey(options.key)) {
    throw new Error(`Invalid key: ${options.key} in contentType.`);
  }
  return { ...options, __type: 'contentType' };
}

/** Defines a Optimizely CMS display template */
export function displayTemplate<T extends DisplayTemplate>(
  options: T
): T & { __type: 'displayTemplate' } {
  if (isValidKey(options.key)) {
    throw new Error(`Invalid key: ${options.key} in displayTemplate.`);
  }
  return { ...options, __type: 'displayTemplate' };
}

/** Defines a Optimizely CMS build configuration */
export function buildConfig<T extends BuildConfig>(
  options: T
): T & { __type: 'buildConfig' } {
  return { ...options, __type: 'buildConfig' };
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

/**
 * Checks if `key` is a valid key name (user defined key insted of base type).
 */
export function isValidKey(key: string): boolean {
  const regex = /^[A-Za-z][_0-9A-Za-z]+$/;
  return !regex.test(key);
}

export { init as initContentTypeRegistry } from './contentTypeRegistry';
