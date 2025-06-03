/**
 * "Functions" (utility types) to infer the expected TypeScript types for content types and content type properties
 *
 * Inferred types are the types returned by the Graph
 */
// Read https://zackoverflow.dev/writing/write-your-own-zod/ for an explanation of how this works

import {
  AnyProperty,
  ArrayProperty,
  BinaryProperty,
  BooleanProperty,
  ComponentProperty,
  ContentProperty,
  ContentReferenceProperty,
  DateTimeProperty,
  FloatProperty,
  IntegerProperty,
  JsonProperty,
  LinkProperty,
  RichTextProperty,
  StringProperty,
  UrlProperty,
} from './model/properties';
import {
  AnyContentType,
  ExperienceContentType,
  SectionContentType,
} from './model/contentTypes';

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
export type InferFromProperty<T extends AnyProperty> =
    T extends BooleanProperty ? boolean
  : T extends BinaryProperty  ? unknown
  : T extends StringProperty ? string
  : T extends DateTimeProperty ? string
  : T extends JsonProperty ? any
  : T extends RichTextProperty ? {html: string; json: any}
  : T extends UrlProperty ? InferredUrl
  : T extends LinkProperty ? { url: InferredUrl }
  : T extends IntegerProperty ? number
  : T extends FloatProperty ? number
  : T extends ContentReferenceProperty ? { url: InferredUrl }
  : T extends ArrayProperty<infer E> ? InferFromProperty<E>[]
  : T extends ContentProperty ? {__typename: string, __viewname: string}
  : T extends ComponentProperty<infer E> ? Infer<E>
  : unknown

/** Attributes included in the response from Graph in every content type */
export type InferredBase = {
  _metadata: {
    url: InferredUrl;
  };
};

/** Infers an `object` with the TS type inferred for each type */
type InferProps<T extends AnyContentType> = T extends {
  properties: Record<string, AnyProperty>;
}
  ? {
      [Key in keyof T['properties']]: InferFromProperty<T['properties'][Key]>;
    }
  : {};

// Special fields for Experience
export type ExperienceNode = ExperienceComponentNode | ExperienceStructureNode;

export type ExperienceCompositionNode = {
  /** Internal node type. Can be `CompositionStructureNode` or `CompositionComponentNode` */
  __typename: string;

  /** Name of the content type if provided, `null` otherwise */
  type: string | null;

  key: string;
  displayName: string;
  displaySettings: {
    key: string;
    value: string;
  }[];
};

export type ExperienceStructureNode = ExperienceCompositionNode & {
  /** "row", "column", etc. */
  nodeType: string;
  nodes: ExperienceNode[];
};
export type ExperienceComponentNode = ExperienceCompositionNode & {
  nodeType: 'component';
  component: {
    __typename: string;
  };
};

/** Adds TS fields specific to `Experience` */
type InferExperience<T extends AnyContentType> = T extends ExperienceContentType
  ? { composition: ExperienceStructureNode }
  : {};

/** Adds TS fields specific to `Section` */
type InferSection = Prettify<{
  key: string;
  nodes: ExperienceNode[];
}>;

/** Infers the TypeScript type for a content type */
type InferFromContentType<T extends AnyContentType> = Prettify<
  // Note: Add `InferSection` here when users can create their own Section
  InferredBase & InferProps<T> & InferExperience<T>
>;

/** Infers the Graph response types of `T`. `T` can be a content type or a property */
// prettier-ignore
export type Infer<T> =
  T extends AnyContentType ? InferFromContentType<T>
: T extends AnyProperty ? InferFromProperty<T>
: T extends SectionContentType ? InferSection
: unknown;
