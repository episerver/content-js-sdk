import { BuildConfig } from './buildConfig.js';
import { AnyContentType } from './contentTypes.js';
import { DisplayTemplate } from './displayTemplates.js';

export {
  createDisplayTemplate,
  getSelectedDisplaySettings,
  createDisplayConfiguration,
} from './displayTemplates.js';

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
export { init as displayTemplateRegistry } from './displayTemplateRegistry.js';
