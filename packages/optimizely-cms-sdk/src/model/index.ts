import { AnyContentType } from './contentTypes';

/** Defines a Optimizely CMS content type */
export function defineContentType<T extends AnyContentType>(contentType: T): T {
  return contentType;
}
