/**
 * Manifest Types - API Wire Format
 *
 * These types represent the JSON structure for POST/GET /experimental/packages.
 * They're based on SDK types but adapted for the generator's expectations.
 */

import {
  ContentTypes,
  Properties,
  DisplayTemplates,
} from '@optimizely/cms-sdk';

/** Manifest - the JSON accepted/returned by the API */
export type Manifest = {
  contentTypes?: ContentType[];
  displayTemplates?: DisplayTemplate[];
};

/**
 * Display Template (API format)
 * Based on SDK's DisplayTemplateVariant but adapted for API responses:
 * - All fields optional except key
 * - Simplified settings type (Record<string, any> instead of structured SettingsType)
 * - No __type marker or tag field
 */
export type DisplayTemplate = Partial<
  Omit<DisplayTemplates.DisplayTemplateVariant, '__type' | 'settings' | 'tag'>
> & {
  key: string;
  settings?: Record<string, any>;
};

/**
 * Content Type (API format)
 * Based on SDK's AnyContentType but adapted for API serialization:
 * - mayContainTypes uses string[] instead of ContentType<T>[] | string[]
 * - properties uses our adapted ContentTypeProperties.All
 * - compositionBehaviors added as optional (only on ComponentContentType in SDK, but needed at API level)
 */
export type ContentType = Omit<
  ContentTypes.AnyContentType,
  'mayContainTypes' | 'properties'
> & {
  mayContainTypes?: string[];
  properties?: Record<string, ContentTypeProperties.All>;
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};

/**
 * Content Type Properties namespace
 * Wraps SDK property types with generator-compatible enum structure
 */
export namespace ContentTypeProperties {
  // Base property type
  export type Base = {
    format?: string;
    displayName?: string;
    description?: string;
    isRequired?: boolean;
    isLocalized?: boolean;
    group?: string;
    sortOrder?: number;
    indexingType?: string;
  };

  // Enum wrapper type supporting multiple formats:
  // 1. SDK format (direct array): [{ value, displayName }, ...]
  // 2. Manifest format (wrapped array): { values: [{ value, displayName }, ...] }
  // 3. OpenAPI format (object map): { values: { "key": "display name", ... } }
  type EnumWrapper<T> =
    | { value: T; displayName: string }[]
    | { values: { value: T; displayName: string }[] }
    | { values: { [key: string]: string } };

  // String property with wrapped enum
  export type String = Omit<Properties.StringProperty, 'enum'> & {
    enum?: EnumWrapper<string>;
  };

  // Integer property with wrapped enum
  export type Integer = Omit<Properties.IntegerProperty, 'enum'> & {
    enum?: EnumWrapper<number>;
  };

  // Float property with wrapped enum
  export type Float = Omit<Properties.FloatProperty, 'enum'> & {
    enum?: EnumWrapper<number>;
  };

  // Content/ContentReference properties - allowedTypes/restrictedTypes must be strings for API format
  export type Content = Omit<
    Properties.ContentProperty,
    'allowedTypes' | 'restrictedTypes'
  > & {
    allowedTypes?: string[];
    restrictedTypes?: string[];
  };

  export type ContentReference = Omit<
    Properties.ContentReferenceProperty,
    'allowedTypes' | 'restrictedTypes'
  > & {
    allowedTypes?: string[];
    restrictedTypes?: string[];
  };

  // Other properties can use SDK types directly
  export type Boolean = Properties.BooleanProperty;
  export type DateTime = Properties.DateTimeProperty;
  export type Binary = Properties.BinaryProperty;
  export type Url = Properties.UrlProperty;
  export type RichText = Properties.RichTextProperty;
  export type Json = Properties.JsonProperty;
  export type Link = Properties.LinkProperty;
  // Component property - contentType must be string for API format
  export type Component = Omit<
    Properties.ComponentProperty<any>,
    'contentType'
  > & {
    contentType: string;
  };

  // Array type
  export type Array = Base & {
    type: 'array';
    items: NonArray;
    minItems?: number;
    maxItems?: number;
  };

  // Union types
  export type NonArray =
    | String
    | Content
    | Binary
    | Boolean
    | DateTime
    | Float
    | Integer
    | Url
    | ContentReference
    | RichText
    | Json
    | Link
    | Component;

  export type All = Array | NonArray;
}
