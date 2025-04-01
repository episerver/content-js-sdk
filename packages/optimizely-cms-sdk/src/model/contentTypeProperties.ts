/** All possible content type properties */
export type AnyProperty = Array<ArrayItems> | ArrayItems;

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

type WithEnum<T> = {
  enum?: {
    values: { value: T; displayName: string }[];
  };
};

export type Array<T extends ArrayItems> = Base & {
  type: 'array';
  items: T;
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

/** Represents the content type property "String" */
export type String = Base & {
  type: 'string';
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
  allowedTypes?: string[];
  restrictedTypes?: string[];
};

/**
 * Reprensents the content type property "Component".
 * Note: this is called "Block" in the GUI
 */
export type Component = Base & {
  type: 'component';
  contentType: string;
};

// Note: `Link` does not exist in the REST API or in the GUI.
// - In the API is called `component` with `contentType=link`
// - In the GUI is called
export type Link = Base & {
  type: 'link';
};
