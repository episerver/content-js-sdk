/** All possible content type properties */
export type AnyProperty = ArrayProperty<ArrayItems> | ArrayItems;

/** A "Base" content type property that includes all common attributes for all content type properties */
type BaseProperty = {
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

export type ArrayProperty<T extends ArrayItems> = BaseProperty & {
  type: 'array';
  items: T;
};

export type ArrayItems =
  | StringProperty
  | BooleanProperty
  | BinaryProperty
  | JsonProperty
  | RichTextProperty
  | UrlProperty
  | IntegerProperty
  | FloatProperty
  | ContentReferenceProperty
  | ContentProperty
  | ComponentProperty
  | LinkProperty;

/** Represents the content type property "String" */
export type StringProperty = BaseProperty & {
  type: 'string';
  minLength?: number;
  maxLength?: number;
} & WithEnum<string>;

export type BooleanProperty = BaseProperty & { type: 'boolean' };
export type BinaryProperty = BaseProperty & { type: 'binary' };
export type JsonProperty = BaseProperty & { type: 'json' };

// Note: `RichText` type does not exist in the REST API. However, we need it to extract the right GraphQL fields from there
export type RichTextProperty = BaseProperty & { type: 'richText' };
export type UrlProperty = BaseProperty & { type: 'url' };
export type IntegerProperty = BaseProperty & {
  type: 'integer';
  minimum?: number;
  maximum?: number;
} & WithEnum<number>;
export type FloatProperty = BaseProperty & {
  type: 'float';
  minimum?: number;
  maximum?: number;
} & WithEnum<number>;
export type ContentReferenceProperty = BaseProperty & {
  type: 'contentReference';
  allowedTypes?: string[];
  restrictedTypes?: string[];
};

export type ContentProperty = BaseProperty & {
  type: 'content';
  allowedTypes?: string[];
  restrictedTypes?: string[];
};

/**
 * Reprensents the content type property "Component".
 * Note: this is called "Block" in the GUI
 */
export type ComponentProperty = BaseProperty & {
  type: 'component';
  contentType: string;
};

// Note: `Link` does not exist in the REST API or in the GUI.
// - In the API is called `component` with `contentType=link`
// - In the GUI is called
export type LinkProperty = BaseProperty & {
  type: 'link';
};
