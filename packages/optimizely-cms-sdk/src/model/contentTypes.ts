import { AnyProperty } from './properties.js';

// Main base types
export const MAIN_BASE_TYPES = [
  '_component',
  '_experience',
  '_section',
  '_page',
] as const;

// Media-related base types
export const MEDIA_BASE_TYPES = ['_image', '_media', '_video'] as const;

// Other base types
export const OTHER_BASE_TYPES = ['_folder'] as const;

// All base types including media and other types
export const ALL_BASE_TYPES = [
  ...MAIN_BASE_TYPES,
  ...MEDIA_BASE_TYPES,
  ...OTHER_BASE_TYPES,
] as const;

export type BaseTypes = (typeof ALL_BASE_TYPES)[number];
export type MediaStringTypes = (typeof MEDIA_BASE_TYPES)[number];

export type PropertiesRecord = Record<string, AnyProperty>;

/**
 * Icon shown next to a content type in the CMS UI.
 *
 * The listed values are the icons the CMS ships with; any other string is
 * accepted for custom icons. `(string & {})` keeps autocomplete on the
 * predefined names while still allowing custom text.
 */
export type ContentTypeIcon =
  | 'Banner'
  | 'Box'
  | 'Browser'
  | 'Bundle'
  | 'Checkbox'
  | 'Checklist'
  | 'Code'
  | 'Comment'
  | 'Dashboard'
  | 'Document'
  | 'Email'
  | 'Excel spreadsheet'
  | 'Folder'
  | 'Globe'
  | 'Grid'
  | 'Heading'
  | 'Image'
  | 'Image landscape'
  | 'Layers'
  | 'Link'
  | 'List'
  | 'Page'
  | 'PDF file'
  | 'Quote'
  | 'Section'
  | 'Shapes'
  | 'Shopping cart'
  | 'Sidebar'
  | 'Start page'
  | 'Table'
  | 'Tablet'
  | 'Tag'
  | 'Task list'
  | 'Text input'
  | 'Toggle'
  | 'Video'
  | 'Website'
  | 'Window'
  | 'Word document'
  | 'ZIP archive'
  | (string & {});

/** A "Base" content type that includes all common attributes for all content types */
type BaseContentType = {
  key: string;
  displayName: string;
  icon?: ContentTypeIcon;
  /**
   * Whether this content type can be previewed on its own, outside any page
   * around it. Defaults to `true`.
   *
   * Set it to `false` for a content type that only makes sense in place — one
   * that reads from the page around it, or renders to nothing by itself. It is
   * then left out of the `componentPreviewUrlFormats` the CLI pushes, so the
   * CMS never offers the preview, and the standalone preview route refuses to
   * render it.
   *
   * Lives only in this SDK: the CMS does not store it, and `config push`
   * strips it from the manifest.
   */
  componentPreview?: boolean;
  extends?: AnyContract | Array<AnyContract>;
  properties?: PropertiesRecord;
};

/** Represents the required values to be provided to make a Contract type */
export type SuppliedContractValues<P extends PropertiesRecord = PropertiesRecord> = {
  key: string;
  displayName: string;
  properties?: P;
  baseType?: never;
};

type InnerContractValues<P extends PropertiesRecord = PropertiesRecord> = {
  isContract: true;
  __type: 'contract';

  /**
   * Phantom property, never set at runtime. It makes `P` invariant, which stops
   * TypeScript from subtype-reducing a union of contracts (as inferred from
   * `extends: [A, B]`) down to the one with the fewest properties.
   */
  readonly __properties?: (properties: P) => P;
};

/** Represents the Contract type in CMS */
export type Contract<P extends PropertiesRecord = PropertiesRecord> =
  SuppliedContractValues<P> & InnerContractValues<P>;

/** A contract with any properties. Use this when passing a contract around. */
export type AnyContract = SuppliedContractValues & InnerContractValues<any>;

/** Convert union to intersection type */
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** Extract properties from contracts without distributing */
type ExtractContractProperties<C> = C extends Contract<infer P> ? P : never;

/** Type-level property merging - mirrors the runtime getMergedProps function */
type MergedPropertiesType<T extends AnyContentType> = ('extends' extends keyof T ?
  T['extends'] extends Array<any> ?
    UnionToIntersection<ExtractContractProperties<T['extends'][number]>>
  : T['extends'] extends Contract<infer P> ? P
  : {}
: {}) &
  ('properties' extends keyof T ? T['properties'] : {});

/** Utility type for content types that don't support composition behaviors */
type SkipCompositionBehaviors<T> = Omit<T, 'compositionBehaviors'>;

/** Represents the Page type  in CMS */
export type PageContentType = SkipCompositionBehaviors<
  BaseContentType & {
    baseType: '_page';
    mayContainTypes?: Array<
      | ContentType<PageContentType | ExperienceContentType | FolderContentType>
      | '_self'
      | string
    >;
  }
>;

/** Represents the Experience type  in CMS */
export type ExperienceContentType = SkipCompositionBehaviors<
  BaseContentType & {
    baseType: '_experience';
    mayContainTypes?: Array<
      | ContentType<PageContentType | ExperienceContentType | FolderContentType>
      | '_self'
      | string
    >;
  }
>;

/** Represents the Folder (Used in the asset panel to organizing content and not in Graph) type in CMS */
export type FolderContentType = SkipCompositionBehaviors<
  BaseContentType & {
    baseType: '_folder';
    mayContainTypes?: Array<ContentType<AnyContentType> | '_self' | string>;
  }
>;

/** Represents the "Component" type (also called "Block") in CMS */
export type ComponentContentType = BaseContentType & {
  baseType: '_component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled' | 'formsElementEnabled')[];
  mayContainTypes?: Array<ContentType<ComponentContentType> | '_self' | string>;
};

/** This content type is used only internally */
export type SectionContentType = SkipCompositionBehaviors<
  BaseContentType & {
    baseType: '_section';
  }
>;

/** Represents a "Media" content type (Image, Media, Video) */
export type MediaContentType = SkipCompositionBehaviors<
  BaseContentType & {
    baseType: MediaStringTypes;
  }
>;

/** All possible content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | PageContentType
  | FolderContentType
  | SectionContentType
  | MediaContentType;

export type ContentType<T extends AnyContentType = AnyContentType> = Omit<
  T,
  'properties'
> & {
  properties: MergedPropertiesType<T>;
  __type: 'contentType';
};

/** All possible content types for allowed and restricted fields */
export type PermittedTypes =
  | AnyContract
  | ContentType
  | AnyContentType['baseType']
  | '_self'
  | (string & {});
