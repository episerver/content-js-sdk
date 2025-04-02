/** Re-Definition of the "Manifest", the JSON accepted in the endpoint POST /packages */
export type Manifest = {
  contentTypes?: ContentType[];
};

/** Content Type */
export interface ContentType {
  key: string;
  displayName?: string;
  baseType:
    | 'page'
    | 'component'
    | 'media'
    | 'image'
    | 'video'
    | 'folder'
    | 'experience'
    | 'section'
    | 'element';
  properties?: Record<string, ContentTypeProperties.All>;
}

export namespace ContentTypeProperties {
  export type All = Array | NonArray;
  export type Array = {
    type: 'array';
    items: NonArray;
  };
  export type NonArray = String | Content;

  // `Base` includes all the common properties for all non-array ContentTypeProperties
  export type Base = {
    // This should be different for each Content Type. In the spec is just "string" for all
    // format?: string;
    displayName?: string;
    description?: string;
    required?: boolean;
    localized?: boolean;
    group?: string;
    sortOrder?: number;
    // TODO
    indexingType?: {};
    editor?: string;
    editorSettings?: Record<string, Record<string, never>> | null;
  };
  export type Binary = Base & {
    type: 'binary';
  };
  export type Boolean = Base & {
    type: 'boolean';
  };
  export type Component = {};
  export type Content = Base & {
    type: 'content';
    allowedTypes?: string[];
    restrictedTypes?: string[];
  };
  export type ContentReference = {};
  export type DateTime = {};
  export type Float = {};
  export type Integer = {};
  export type String = Base & {
    type: 'string';

    // Not available in the schema:
    format?: 'shortString' | 'html';
    minLength?: number;
    maxLength?: number;
    enum?: {
      // TODO: Check the enums here
      values: { value: string; displayName: string }[];
    };
  };
  export type Url = {};
  export type JsonString = {};
  export type List = {};
}
