import { AnyContentType, ContentType, PermittedTypes } from './contentTypes.js';
import { PropertyGroupKey } from './buildConfig.js';

/** JSON type definitions */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** All possible content type properties */
export type AnyProperty = ArrayProperty<ArrayItems> | ArrayItems;

export type INDEX_TYPE = 'disabled' | 'queryable' | 'searchable';

export type RICHTEXT_PRESET = 'default' | 'expanded' | 'minimal';

/** How a property is displayed in the editing interface. Defaults to `available`. */
export type DISPLAY_MODE = 'available' | 'hidden';

/** A "Base" content type property that includes all common attributes for all content type properties */
type BaseProperty = {
  format?: string;
  displayName?: string;
  description?: string;
  isRequired?: boolean;
  isLocalized?: boolean;
  group?: PropertyGroupKey;
  sortOrder?: number;
  indexingType?: INDEX_TYPE;
  displayMode?: DISPLAY_MODE;
};

type WithEnum<T> = {
  enum?: { value: T; displayName: string }[];
};

export type ArrayProperty<T extends ArrayItems> = BaseProperty & {
  type: 'array';
  items: Exclude<T, ArrayProperty<any>>;
  minItems?: number;
  maxItems?: number;
};

/** Represents the content type property "String" */
export type StringProperty = BaseProperty & {
  type: 'string';

  /**
   * Regular expression.
   *
   * @example "\\d\\d\\d\\d-\\d\\d-\\d\\d"
   */
  pattern?: string;
  minLength?: number;
  maxLength?: number;
} & WithEnum<string>;

export type BooleanProperty = BaseProperty & { type: 'boolean' };
export type BinaryProperty = BaseProperty & { type: 'binary' };
export type JsonProperty<TSchema = JsonValue> = BaseProperty & {
  type: 'json';
  /** @internal used for type inference only - not a runtime property */
  readonly __schema?: TSchema;
};
export type DateTimeProperty = BaseProperty & {
  type: 'dateTime';
  minimum?: string;
  maximum?: string;
};

export type RichTextProperty = BaseProperty & {
  type: 'richText';
  editorSettings?: { preset: RICHTEXT_PRESET };
};
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

/** Represents type constraints for "content" and "contentReference" properties */
type ContentAndRefBlock =
  | {
      contentType: AnyContentType | ContentType | string;
      allowedTypes?: never;
      restrictedTypes?: never;
    }
  | {
      contentType?: never;
      allowedTypes: PermittedTypes[];
      restrictedTypes?: PermittedTypes[];
    }
  | {
      contentType?: never;
      allowedTypes?: PermittedTypes[];
      restrictedTypes: PermittedTypes[];
    };

type BaseContentReferenceProperty = BaseProperty & {
  type: 'contentReference';
};

type BaseContentProperty = BaseProperty & {
  type: 'content';
};

export type ContentReferenceProperty = BaseContentReferenceProperty & ContentAndRefBlock;

export type ContentProperty = BaseContentProperty & ContentAndRefBlock;

export type ArrayItems =
  | StringProperty
  | BooleanProperty
  | BinaryProperty
  | JsonProperty
  | DateTimeProperty
  | RichTextProperty
  | UrlProperty
  | IntegerProperty
  | FloatProperty
  | ContentReferenceProperty
  | ContentProperty
  | ComponentProperty<AnyContentType>
  | LinkProperty
  | CompositionProperty;

/**
 * Reprensents the content type property "Component".
 * Note: this is called "Block" in the GUI
 */
export type ComponentProperty<T extends AnyContentType> = BaseProperty & {
  type: 'component';
  contentType: T;
};

// Note: `Link` does not exist in the REST API or in the GUI.
// - In the API is called `component` with `contentType=link`
// - In the GUI is called
export type LinkProperty = BaseProperty & {
  type: 'link';
};

/** The layouts a composition property can be edited and rendered in. */
export const COMPOSITION_FORMATS = ['grid', 'outline'] as const;

/** Layout of a composition property. The CMS requires one; it has no default. */
export type CompositionFormat = (typeof COMPOSITION_FORMATS)[number];

/**
 * Represents the content type property "Composition": a nested tree of rows,
 * columns and components, the same shape an experience's built-in `composition`
 * holds.
 *
 * Declaring one under the reserved key `composition` overrides the built-in
 * property of an experience; any other key defines a custom composition.
 * `allowedTypes`/`restrictedTypes` constrain what the CMS editor may place in
 * it — they do not narrow the generated query, which always selects every
 * composition element type.
 */
export type CompositionProperty = BaseProperty & {
  type: 'composition';
  format: CompositionFormat;
  minItems?: number;
  maxItems?: number;
  allowedTypes?: PermittedTypes[];
  restrictedTypes?: PermittedTypes[];
};
