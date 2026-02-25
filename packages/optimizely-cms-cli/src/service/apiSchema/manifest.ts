/** Re-Definition of the "Manifest", the JSON accepted in the endpoint POST /packages */
export type Manifest = {
  contentTypes?: ContentType[];
};

/** Content Type */
export interface ContentType {
  key: string;
  displayName?: string;
  baseType:
    | '_page'
    | '_component'
    | '_media'
    | '_image'
    | '_video'
    | '_folder'
    | '_experience'
    | '_section'
    | '_element';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
  mayContainTypes?: string[];
  properties?: Record<string, ContentTypeProperties.All>;
}

export namespace ContentTypeProperties {
  // Forward declarations for types used in All
  export type All = Array | NonArray;
  export type Array = {
    type: 'array';
    items: NonArray;
  };

  // `Base` includes all the common properties for all non-array ContentTypeProperties
  export type Base = {
    format?: string;
    displayName?: string;
    description?: string;
    required?: boolean;
    localized?: boolean;
    group?: string;
    sortOrder?: number;
    indexingType?: string;
  };

  export type Binary = Base & {
    type: 'binary';
  };

  export type Boolean = Base & {
    type: 'boolean';
  };

  export type Content = Base & {
    type: 'content';
    allowedTypes?: string[];
    restrictedTypes?: string[];
  };

  export type ContentReference = Base & {
    type: 'contentReference';
    allowedTypes?: string[];
    restrictedTypes?: string[];
  };

  export type DateTime = Base & {
    type: 'dateTime';
    minimum?: string;
    maximum?: string;
  };

  export type Float = Base & {
    type: 'float';
    minimum?: number;
    maximum?: number;
    enum?: {
      values: { value: number; displayName: string }[];
    };
  };

  export type Integer = Base & {
    type: 'integer';
    minimum?: number;
    maximum?: number;
    enum?: {
      values: { value: number; displayName: string }[];
    };
  };

  export type String = Base & {
    type: 'string';
    format?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    enum?: {
      values: { value: string; displayName: string }[];
    };
  };

  export type Url = Base & {
    type: 'url';
  };

  export type RichText = Base & {
    type: 'richText';
  };

  export type Json = Base & {
    type: 'json';
  };

  export type Link = Base & {
    type: 'link';
  };

  export type Component = Base & {
    type: 'component';
    contentType: string;
  };

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
}
