import { AnyContentType, ContentType, PermittedTypes } from './contentTypes.js';
import { PropertyGroupKey } from './buildConfig.js';

/** JSON type definitions */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** All possible content type properties */
// A composition is not an `ArrayItems`: the CMS takes no array of compositions.
export type AnyProperty = ArrayProperty<ArrayItems> | ArrayItems | CompositionProperty;

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
  | LinkProperty;

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

/** Layout of a composition property, validated by the CMS as a layout type. */
export type CompositionFormat = (typeof COMPOSITION_FORMATS)[number];

/**
 * An extra visual builder area on an experience: a tree of rows, columns and
 * components, the same shape as the built-in `composition`.
 *
 * Only an `_experience` may declare one, under any key except `composition`,
 * which the CMS reserves for the built-in property.
 *
 * `format` picks the layout, and with it what the area can hold:
 *
 * - `grid` — rows and columns of **elements**: `elementEnabled` components, or
 *   the base type `_component`
 * - `outline` — a flat, ordered list of **sections**: `sectionEnabled`
 *   components, `_section` content types, or `_component`
 *
 * `allowedTypes` and `restrictedTypes` are optional; left out, every composition
 * element is allowed. When present they may only name types the `format` permits
 * — the CMS rejects a `sectionEnabled` component in a `grid`, and an
 * `elementEnabled` one in an `outline`. Neither list narrows the generated query,
 * which always selects every composition element type.
 */
export type CompositionProperty = BaseProperty & {
  type: 'composition';
  format: CompositionFormat;
  allowedTypes?: PermittedTypes[];
  restrictedTypes?: PermittedTypes[];
};

/**
 * Configures the built-in composition — the "canvas" — that an `_experience` or
 * `_section` has without declaring it.
 *
 * This is not a property: it sits beside `properties` on the content type,
 * because the CMS reserves the key `composition` and rejects it as a custom
 * property. Everything else matches {@linkcode CompositionProperty}, including
 * the layout-dependent restrictions and that they do not narrow the generated
 * query.
 */
export type CompositionConfiguration = {
  /** Editing layout. Left out, the base type's own default applies. */
  format?: CompositionFormat;
  allowedTypes?: PermittedTypes[];
  restrictedTypes?: PermittedTypes[];
};
