import { AnyProperty } from './properties.js';

// Main base types
export const MAIN_BASE_TYPES = [
  '_component',
  '_experience',
  '_section',
] as const;

// Media-related base types
export const MEDIA_BASE_TYPES = ['_image', '_media', '_video'] as const;

// Other base types
export const OTHER_BASE_TYPES = ['_page', '_folder', '_element'] as const;

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

/** Represents the "Component" type (also called "Block") in CMS */
export type ComponentContentType = BaseContentType & {
  baseType: '_component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};

export type ExperienceContentType = BaseContentType & {
  baseType: '_experience';
};

// This content type is used only internally
export type SectionContentType = BaseContentType & {
  baseType: '_section';
};

/** Represents all other types in CMS. They don't have any additional property */
export type OtherContentTypes = BaseContentType & {
  baseType: BaseTypes;
};

/**
 * Represents a "Media" content type (Image, Media, Video).
 */
export type MediaContentType = BaseContentType & {
  baseType: MediaStringTypes;
};

/** All possible content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | SectionContentType
  | OtherContentTypes
  | MediaContentType;

export type ContentType<T = AnyContentType> = T & { __type: 'contentType' };

/** All possible content type for allowed and restricted fields */
export type PermittedTypes = ContentType | AnyContentType['baseType'];
