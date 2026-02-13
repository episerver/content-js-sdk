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
} from './model/properties.js';
import {
  AnyContentType,
  ExperienceContentType,
  SectionContentType,
} from './model/contentTypes.js';
import { Node } from './components/richText/renderer.js';
import {
  PublicImageAsset,
  PublicRawFileAsset,
  PublicVideoAsset,
} from './model/assets.js';
import { DisplayTemplate } from './model/displayTemplates.js';

/** Forces Intellisense to resolve types */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type InferredUrl = {
  type: string | null;
  default: string | null;
  hierarchical: string | null;
  internal: string | null;
  graph: string | null;
  base: string | null;
};

type InferredItemMetadata = {
  changeset: string | null;
  displayOption: string | null;
};

type InferredInstanceMetadata = {
  changeset: string | null;
  locales: string[];
  expired: string | null;
  container: string | null;
  owner: string | null;
  routeSegment: string | null;
  lastModifiedBy: string | null;
  path: string[];
  createdBy: string | null;
};

type InferredContentMetadata = {
  key: string;
  locale: string;
  fallbackForLocale: string;
  version: string;
  displayName: string;
  url: InferredUrl;
  types: string[];
  published: string;
  status: string;
  created: string;
  lastModified: string;
  sortOrder: number;
  variation: string;
} & Partial<InferredInstanceMetadata> &
  Partial<InferredItemMetadata>;

type InferredRichText = {
  html: string;
  json: { type: 'richText'; children: Node[] };
};

/** Asset types that can be returned in ContentReference */
export type ContentReferenceItem =
  | PublicImageAsset
  | PublicVideoAsset
  | PublicRawFileAsset;

export type InferredContentReference = {
  url: InferredUrl;
  item: ContentReferenceItem | null;
};

/** Infers the Typescript type for each content type property */
// prettier-ignore
export type InferFromProperty<T extends AnyProperty> =
    T extends BooleanProperty ? boolean
  : T extends BinaryProperty  ? unknown
  : T extends StringProperty ? string
  : T extends DateTimeProperty ? string
  : T extends JsonProperty ? any
  : T extends RichTextProperty ? InferredRichText
  : T extends UrlProperty ? InferredUrl
  : T extends LinkProperty ? { text: string | null, title: string | null, target: string | null, url: InferredUrl }
  : T extends IntegerProperty ? number
  : T extends FloatProperty ? number
  : T extends ContentReferenceProperty ? InferredContentReference
  : T extends ArrayProperty<infer E> ? InferFromProperty<E>[]
  : T extends ContentProperty ? {__typename: string, __viewname: string}
  : T extends ComponentProperty<infer E> ? ContentProps<E>
  : unknown

/** Attributes included in the response from Graph in every content type */
export type InferredBase = {
  _id: string;
  _metadata: InferredContentMetadata;

  // Properties that don't come from Graph are prefixed with double-underscores
  __typename: string;
  __context?: { edit: boolean; preview_token: string };
  __composition?: ExperienceComponentNode;
};

/** Only include keys where indexingType is not 'disabled' */
type EnabledKeys<T extends Record<string, AnyProperty>> = {
  [K in keyof T]: T[K]['indexingType'] extends 'disabled' ? never : K;
}[keyof T];

/** Infers an `object` with the TS type inferred for each type */
type InferProps<T extends AnyContentType> = T extends {
  properties: Record<string, AnyProperty>;
}
  ? {
      [Key in EnabledKeys<T['properties']>]: InferFromProperty<
        T['properties'][Key]
      > | null;
    }
  : {};

// Special fields for Experience
export type ExperienceNode = ExperienceComponentNode | ExperienceStructureNode;

export type DisplaySettingsType = {
  key: string;
  value: string;
};

export type ExperienceCompositionNode = {
  /** Internal node type. Can be `CompositionStructureNode` or `CompositionComponentNode` */
  __typename: string;
  __context?: { edit: boolean; preview_token: string };

  /** Name of the content type if provided, `null` otherwise */
  type: string | null;

  key: string;
  layoutType: string | null;
  displayName: string;
  displayTemplateKey: string | null;
  displaySettings: DisplaySettingsType[] | null;
};

export type ExperienceStructureNode = ExperienceCompositionNode & {
  /** "row", "column", etc. */
  nodeType: string;
  nodes?: ExperienceNode[];
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
type InferSection<T extends AnyContentType> = T extends SectionContentType
  ? {
      key: string;
      nodes: ExperienceNode[];

      __typename: string;
      __context?: { edit: boolean; preview_token: string };
    }
  : {};

/** Infers the TypeScript type for a content type */
type InferFromContentType<T extends AnyContentType> = Prettify<
  InferredBase & InferProps<T> & InferExperience<T> & InferSection<T>
>;

/** Infers the TypeScript type for a display setting */
type InferFromDisplayTemplate<T extends DisplayTemplate> = T extends {
  settings: infer S;
}
  ? {
      [K in keyof S]: S[K] extends {
        choices: Record<string, any>;
        editor: infer E;
      }
        ? E extends 'select'
          ? keyof S[K]['choices']
          : E extends 'checkbox'
          ? boolean
          : never
        : never;
    }
  : {};

/** Infers the Graph response types of `T`. `T` can be a content type or a property */
// prettier-ignore
export type ContentProps<T> =
  T extends DisplayTemplate ? InferFromDisplayTemplate<T>
  : T extends AnyContentType ? InferFromContentType<T>
  : T extends AnyProperty ? InferFromProperty<T>
  : unknown;
