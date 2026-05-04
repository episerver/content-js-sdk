import { AnyProperty } from './properties.js';

// Main base types
export const MAIN_BASE_TYPES = ['_component', '_experience', '_section', '_page'] as const;

// Media-related base types
export const MEDIA_BASE_TYPES = ['_image', '_media', '_video'] as const;

// Other base types
export const OTHER_BASE_TYPES = ['_folder'] as const;

// All base types including media and other types
export const ALL_BASE_TYPES = [...MAIN_BASE_TYPES, ...MEDIA_BASE_TYPES, ...OTHER_BASE_TYPES] as const;

export type BaseTypes = (typeof ALL_BASE_TYPES)[number];
export type MediaStringTypes = (typeof MEDIA_BASE_TYPES)[number];

export type PropertiesRecord = Record<string, AnyProperty>;

/** A "Base" content type that includes all common attributes for all content types */
type BaseContentType = {
  key: string;
  displayName: string;
  extends?: Contract | Array<Contract>;
  properties?: PropertiesRecord;
};

/** Represents the required values to be provided to make a Contract type */
export type SuppliedContractValues<P extends PropertiesRecord = PropertiesRecord> = {
  key: string;
  displayName: string;
  properties: P;
};

type InnerContractValues = {
  isContract: true;
  __type: 'contract';
};

/** Represents the Contract type in CMS */
export type Contract<P extends PropertiesRecord = PropertiesRecord> = SuppliedContractValues<P> & InnerContractValues;

/** Convert union to intersection type */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** Extract properties from contracts without distributing */
type ExtractContractProperties<C> = C extends Contract<infer P> ? P : never;

/** Type-level property merging - mirrors the runtime getMergedProps function */
type MergedPropertiesType<T extends AnyContentType> = ('extends' extends keyof T ?
  T['extends'] extends Array<any> ? UnionToIntersection<ExtractContractProperties<T['extends'][number]>>
  : T['extends'] extends Contract<infer P> ? P
  : {}
: {}) &
  ('properties' extends keyof T ? T['properties'] : {});

/** Represents the Page type  in CMS */
export type PageContentType = BaseContentType & {
  baseType: '_page';
  mayContainTypes?: Array<ContentType<PageContentType | ExperienceContentType | FolderContentType> | '_self' | string>;
};

/** Represents the Experience type  in CMS */
export type ExperienceContentType = BaseContentType & {
  baseType: '_experience';
  mayContainTypes?: Array<ContentType<PageContentType | ExperienceContentType | FolderContentType> | '_self' | string>;
};

/** Represents the Folder (Used in the asset panel to organizing content and not in Graph) type in CMS */
export type FolderContentType = BaseContentType & {
  baseType: '_folder';
  mayContainTypes?: Array<ContentType<AnyContentType> | '_self' | string>;
};

/** Represents the "Component" type (also called "Block") in CMS */
export type ComponentContentType = BaseContentType & {
  baseType: '_component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[]; // Add "formsElementEnabled" here if when forms are supported in components
  mayContainTypes?: Array<ContentType<ComponentContentType> | '_self' | string>;
};

/** This content type is used only internally */
export type SectionContentType = BaseContentType & {
  baseType: '_section';
};

/** Represents a "Media" content type (Image, Media, Video) */
export type MediaContentType = BaseContentType & {
  baseType: MediaStringTypes;
};

/** All possible content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | PageContentType
  | FolderContentType
  | SectionContentType
  | MediaContentType;

export type ContentType<T extends AnyContentType = AnyContentType> = Omit<T, 'properties'> & {
  properties: MergedPropertiesType<T>;
  __type: 'contentType';
};

/** All possible content types for allowed and restricted fields */
export type PermittedTypes = Contract | ContentType | AnyContentType['baseType'] | '_self';
