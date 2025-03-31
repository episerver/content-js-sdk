/** All possible content type properties */
export type ContentTypeProperty =
  | MultiSelectString
  | SelectOneString
  | Array
  | ArrayItems;

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

// TODO: check if "multi-select" can be other things than strings
// if not, MultiSelectString can be simpler
export type MultiSelectString = Base & {
  type: 'array';
  format: 'selectMany';
  items: {
    type: 'string';

    // TODO: Check if other types can have enums
    enum: {
      values: { value: string; displayName: string }[];
    };
  };
};

// TODO: Check that values in "LinkCollection" are constants.
// If that is the case, users should no input them by hand.
export type LinkCollection = Base & {
  type: 'array';
  format: 'LinkCollection';
  items: {
    type: 'component';
    contentType: 'link';
  };
};

export type SelectOneString = Base & {
  type: 'string';
  format: 'selectOne';
  enum: {
    values: { value: string; displayName: string }[];
  };
};

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
  | Float;

/** Represents the content type property "String" */
export type String = Base & {
  type: 'string';
  format?: 'shortString';
  minLength?: number;
  maxLength?: number;
};

export type Boolean = Base & { type: 'boolean' };
export type Binary = Base & { type: 'binary' };
export type Json = Base & { type: 'json' };
export type RichText = Base & { type: 'richText' };
export type Url = Base & { type: 'url' };
export type Integer = Base & {
  type: 'integer';
  minimum?: number;
  maximum?: number;
};
export type Float = Base & {
  type: 'float';
  minimum?: number;
  maximum?: number;
};
export type ContentReference = Base & {
  type: 'contentReference';
};

// TODO: "link collection" in CMS is "array of component<contentType: link>"

// In "allowedTypes", things are not called exactly as in the GUI:
// - Block in the GUI = `component` in the API
// - Pages in the GUI = `Page`
// - Images = `Image`
// - Video = `Video`
// - Media = `Media`
