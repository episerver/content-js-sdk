import { AnyContentType } from './contentTypes';

/** Defines a Optimizely CMS content type */
export function contentType<T extends AnyContentType>(options: T): T {
  return options;
}
