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
export const OTHER_BASE_TYPES = ['_folder', '_element'] as const;

// All base types including media and other types
export const ALL_BASE_TYPES = [
  ...MAIN_BASE_TYPES,
  ...MEDIA_BASE_TYPES,
  ...OTHER_BASE_TYPES,
] as const;

export type BaseTypes = (typeof ALL_BASE_TYPES)[number];
export type MediaStringTypes = (typeof MEDIA_BASE_TYPES)[number];

/** A "Base" content type that includes all common attributes for all content types */
type BaseContentType = {
  key: string;
  displayName?: string;
  properties?: Record<string, AnyProperty>;
};

/** Represents the Page type  in CMS */
export type PageContentType = BaseContentType & {
  baseType: '_page';
  mayAllowedTypes?: Array<
    ContentType<PageContentType | ExperienceContentType | FolderContentType>
  >;
};

/** Represents the Experience type  in CMS */
export type ExperienceContentType = BaseContentType & {
  baseType: '_experience';
  mayAllowedTypes?: Array<
    ContentType<PageContentType | ExperienceContentType | FolderContentType>
  >;
};

/** Represents the Folder (Used in the asset panel to organizing content and not in Graph) type in CMS */
export type FolderContentType = BaseContentType & {
  baseType: '_folder';
  mayAllowedTypes?: Array<ContentType<AnyContentType>>;
};

/** Represents the "Component" type (also called "Block") in CMS */
export type ComponentContentType = BaseContentType & {
  baseType: '_component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
  mayAllowedTypes?: Array<ContentType<ComponentContentType>>;
};

/** This content type is used only internally */
export type SectionContentType = BaseContentType & {
  baseType: '_section';
};

/** Represents element content type */
export type ElementContentType = BaseContentType & {
  baseType: '_element';
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
  | ElementContentType
  | MediaContentType;

export type ContentType<T = AnyContentType> = T & { __type: 'contentType' };

/** All possible content type for allowed and restricted fields */
export type PermittedTypes = ContentType | AnyContentType['baseType'];
