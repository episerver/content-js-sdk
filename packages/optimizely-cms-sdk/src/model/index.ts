import { BuildConfig } from './buildConfig.js';
import { AnyContentType } from './contentTypes.js';
import { DisplayTemplate, DisplayTemplateVariant } from './displayTemplates.js';
export { contentType } from './contentTypes.js';

/** Defines a Optimizely CMS display template */
export function displayTemplate<T extends DisplayTemplateVariant>(
  options: T
): T & { __type: 'displayTemplate' } {
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

export { init as initContentTypeRegistry } from './contentTypeRegistry.js';
export { init as initDisplayTemplateRegistry } from './displayTemplateRegistry.js';
