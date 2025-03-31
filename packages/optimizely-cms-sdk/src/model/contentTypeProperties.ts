/** All possible content type properties */
export type ContentTypeProperty = String;

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

/** Represents the content type property "String" */
export type String = Base & {
  type: 'string';
  format?: 'shortString';
  minLength?: number;
  maxLength?: number;
  enum?: {
    values: { value: string; displayName: string }[];
  };
};

/** Represents all other content type properties in CMS. They don't have any additional attribute */
export type Others = Base & {};
