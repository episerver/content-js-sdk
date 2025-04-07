import { AnyContentType } from './contentTypes';
import { DisplayTemplate } from './displayTemplates';

/** Defines a Optimizely CMS content type */
export function contentType<T extends AnyContentType>(options: T): T {
  return options;
}

/** Defines a Optimizely CMS display template */
export function displayTemplate<T extends DisplayTemplate>(options: T): T {
  return options;
}
