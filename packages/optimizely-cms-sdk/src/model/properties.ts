import { AnyContentType, PermittedTypes } from './contentTypes.js';
import { PropertyGroupKey } from './buildConfig.js';

/** All possible content type properties */
export type AnyProperty = ArrayProperty<ArrayItems> | ArrayItems;

export type INDEX_TYPE = 'disabled' | 'queryable' | 'searchable';

export type RICHTEXT_PRESET = 'default' | 'expanded' | 'standard' | 'minimal';

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
export type JsonProperty = BaseProperty & { type: 'json' };
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

type BaseContentReferenceProperty = BaseProperty & {
  type: 'contentReference';
  contentType?: AnyContentType | string;
};

export type ContentReferenceProperty =
  | (BaseContentReferenceProperty & {
      allowedTypes: PermittedTypes[];
      restrictedTypes?: PermittedTypes[];
    })
  | (BaseContentReferenceProperty & {
      allowedTypes?: PermittedTypes[];
      restrictedTypes: PermittedTypes[];
    });

type BaseContentProperty = BaseProperty & {
  type: 'content';
  contentType?: AnyContentType | string;
};

export type ContentProperty =
  | (BaseContentProperty & {
      allowedTypes: PermittedTypes[];
      restrictedTypes?: PermittedTypes[];
    })
  | (BaseContentProperty & {
      allowedTypes?: PermittedTypes[];
      restrictedTypes: PermittedTypes[];
    });

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