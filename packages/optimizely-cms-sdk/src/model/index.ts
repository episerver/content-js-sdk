import { ContentType } from './contentTypes';

/** Defines a Optimizely CMS content type */
export function defineContentType<T extends ContentType>(contentType: T): T {
  return contentType;
}
