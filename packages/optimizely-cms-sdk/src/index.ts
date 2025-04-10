import { type InferFromContentType } from './infer';
import { AnyContentType } from './model/contentTypes';

export { contentType } from './model';
export namespace contentType {
  /**
   * Infers the type consisting of the fields included in a CMS content with the content type `T`
   */
  export type infer<T extends AnyContentType> = InferFromContentType<T>;
}
export * as ContentTypes from './model/contentTypes';
export * as ContentTypeProperties from './model/properties';
