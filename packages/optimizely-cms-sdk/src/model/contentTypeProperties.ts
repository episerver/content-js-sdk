/** All possible content type properties */
export type ContentTypeProperty = Array | ArrayItems;

/** A "Base" content type property that includes all common attributes for all content type properties */
type Base = {
  format?: string;
  displayName?: string;
  description?: string;
  required?: boolean;
  localized?: boolean;
  group?: string;
  sortOrder?: number;
  indexingType?: {};
  editor?: string;
  editorSettings?: Record<string, Record<string, never>> | null;
};

type WithEnum<T> =
  | {
      format: 'selectOne';
      enum: {
        values: { value: T; displayName: string }[];
      };
    }
  | {};

export type Array = Base & {
  items: ArrayItems;
  format?: 'selectMany';
};

export type ArrayItems =
  | String
  | Boolean
  | Binary
  | Json
  | RichText
  | Url
  | Integer
  | Float
  | ContentReference
  | Component
  | Link;

export type MultiSelect = Base & {
  type: 'array';
  format: 'selectMany';
  // items:
};

/** Represents the content type property "String" */
export type String = Base & {
  type: 'string';
  format?: 'shortString';
  minLength?: number;
  maxLength?: number;
} & WithEnum<string>;

export type Boolean = Base & { type: 'boolean' };
export type Binary = Base & { type: 'binary' };
export type Json = Base & { type: 'json' };

// Note: `RichText` type does not exist in the REST API. However, we need it to extract the right GraphQL fields from there
export type RichText = Base & { type: 'richText' };
export type Url = Base & { type: 'url' };
export type Integer = Base & {
  type: 'integer';
  minimum?: number;
  maximum?: number;
} & WithEnum<number>;
export type Float = Base & {
  type: 'float';
  minimum?: number;
  maximum?: number;
} & WithEnum<number>;
export type ContentReference = Base & {
  type: 'contentReference';
};

/**
 * Reprensents the content type property "Component".
 * Note: this is called "Block" in the GUI
 */
export type Component = Base & {
  type: 'component';
  contentType: string;
};

// Note: `Link` does not exist in the REST API. It is called `component` with `contentType=link`
export type Link = Base & {
  type: 'link';
};

export type InferredBaseProperties = {
  _metadata: {
    url: {
      default: string;
    };
  };
};

/** Infers the Typescript type for each content type property */
// prettier-ignore
export type InferFromProperty<T extends ContentTypeProperty> =
    T extends Boolean ? boolean
  : T extends Binary  ? unknown
  : T extends Json ? any
  : T extends RichText ? {html: string; json: any}
  : T extends Url ? {}
  : T extends Integer ? number
  : T extends Float ? number
  : T extends ContentReference ? {}
  : {}
