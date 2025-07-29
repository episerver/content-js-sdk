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
export type BaseContentType<T extends BaseTypes> = {
  key: string;
  displayName?: string;
  baseType: T;
  mayContainTypes?: Extract<AnyContentType, { baseType: T }>[];
  properties?: Record<string, AnyProperty>;
};

/** Represents the "Component" type (also called "Block") in CMS */
export type ComponentContentType = BaseContentType<'_component'> & {
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};
export type ExperienceContentType = BaseContentType<'_experience'>;

// This content type is used only internally
export type SectionContentType = BaseContentType<'_section'>;
/**
 * Represents a "Media" content type (Image, Media, Video).
 */
export type MediaContentType = BaseContentType<MediaStringTypes>;

/** Represents all other types in CMS. They don't have any additional property */
export type OtherContentTypes = BaseContentType<
  '_page' | '_folder' | '_element'
>;

/** All possible content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | SectionContentType
  | MediaContentType
  | OtherContentTypes;

export type ContentType<T = AnyContentType> = T & { __type: 'contentType' };

/** All possible content type for allowed and restricted fields */
export type PermittedTypes = ContentType | AnyContentType['baseType'];

// Content type overloads for different base types
export function contentType<
  T extends BaseContentType<'_component'> & {
    compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
  }
>(options: T): T & { __type: 'contentType' };

// PAGES & EXPERIENCES
export function contentType<
  T extends Omit<
    BaseContentType<'_page' | '_experience'>,
    'mayContainTypes'
  > & {
    baseType: '_page' | '_experience';
    mayContainTypes?: Extract<
      AnyContentType,
      { baseType: '_page' | '_experience' }
    >[];
  }
>(options: T): T & { __type: 'contentType' };

// SECTIONS
export function contentType<T extends BaseContentType<'_section'>>(
  options: T
): T & { __type: 'contentType' };

//  MEDIA TYPES
export function contentType<T extends BaseContentType<MediaStringTypes>>(
  options: T
): T & { __type: 'contentType' };

// FOLDERS & ELEMENTS
export function contentType<T extends BaseContentType<'_folder' | '_element'>>(
  options: T
): T & { __type: 'contentType' };

// GENERAL CONTENT TYPE
export function contentType<T extends AnyContentType>(
  options: T
): T & { __type: 'contentType' };

// Fallback for any content type
export function contentType(options: any) {
  return { ...options, __type: 'contentType' };
}
