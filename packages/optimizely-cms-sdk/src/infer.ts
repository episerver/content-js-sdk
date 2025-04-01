/**
 * "Functions" (utility types) to infer the expected TypeScript types for content types and content type properties
 *
 * Inferred types are the types returned by the Graph
 */
// Read https://zackoverflow.dev/writing/write-your-own-zod/ for an explanation of how this works

import * as CTP from './model/contentTypeProperties';
import * as CT from './model/contentTypes';

/** Forces Intellisense to resolve types */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type InferredUrl = {
  type: string;
  default: string;
};

/** Infers the Typescript type for each content type property */
// prettier-ignore
export type InferFromProperty<T extends CTP.ContentTypeProperty> =
    T extends CTP.Boolean ? boolean
  : T extends CTP.Binary  ? unknown
  : T extends CTP.Json ? any
  : T extends CTP.RichText ? {html: string; json: any}
  : T extends CTP.Url ? InferredUrl
  : T extends CTP.Link ? { url: InferredUrl }
  : T extends CTP.Integer ? number
  : T extends CTP.Float ? number
  : T extends CTP.ContentReference ? {}
  : T extends CTP.Array<infer E> ? InferFromProperty<E>[]
  : {}

/** Attributes included in the response from Graph in every content type */
export type InferredBase = {
  _metadata: {
    url: InferredUrl;
  };
};

/** Infers an `object` with the TS type inferred for each type */
type InferProps<T extends CT.ContentType> = T extends {
  properties: Record<string, CTP.ContentTypeProperty>;
}
  ? {
      [Key in keyof T['properties']]: InferFromProperty<T['properties'][Key]>;
    }
  : {};

/** Adds TS fields specific to `Experience` */
type InferExperience<T extends CT.ContentType> = T extends CT.Experience
  ? {
      composition: {
        nodes: {
          component?: {
            __typename: string;
          };
        }[];
      };
    }
  : {};

/** Infers the TypeScript type for a content type */
export type InferFromContentType<T extends CT.ContentType> = Prettify<
  InferredBase & InferProps<T> & InferExperience<T>
>;
