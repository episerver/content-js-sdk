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

// Enum of all base types
export type BaseTypes = (typeof ALL_BASE_TYPES)[number];

// Enum of main base types
export type MediaStringTypes = (typeof MEDIA_BASE_TYPES)[number];

/** Base shape for all content types */
export type BaseContentType<T extends BaseTypes> = {
  key: string;
  displayName?: string;
  baseType: T;
  properties?: Record<string, AnyProperty>;
  mayContainTypes?: Extract<AnyContentType, { baseType: T }>[];
};

/** Specific variants */
export type ComponentContentType = BaseContentType<'_component'> & {
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};
export type ExperienceContentType = BaseContentType<'_experience'>;

export type PageContentType = BaseContentType<'_page'>;

// This content type is used only internally
export type SectionContentType = BaseContentType<'_section'>;

/**
 * Represents a "Media" content type (Image, Media, Video).
 */
export type MediaContentType = BaseContentType<MediaStringTypes>;

/** Represents all other types in CMS */
export type OtherContentTypes = BaseContentType<'_folder' | '_element'>;

/** Union of all variants */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | PageContentType
  | SectionContentType
  | MediaContentType
  | OtherContentTypes;

/** Branded factory result */
export type ContentType<T extends AnyContentType = AnyContentType> = T & {
  __type: 'contentType';
};

/** All possible inputs for fields that accept content types */
export type PermittedTypes = ContentType | AnyContentType['baseType'];

/**  Overload-based contentType definitions with generic return type for inference */

/** COMPONENTS — only allow other components */
export function contentType<
  T extends Omit<BaseContentType<'_component'>, 'mayContainTypes'> & {
    compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
    mayContainTypes?: ContentType<ComponentContentType>[];
  }
>(options: T): T & { __type: 'contentType' };

/** PAGES — allow pages & experiences */
export function contentType<
  T extends Omit<BaseContentType<'_page'>, 'mayContainTypes'> & {
    mayContainTypes?: ContentType<PageContentType | ExperienceContentType>[];
  }
>(options: T): T & { __type: 'contentType' };

/** EXPERIENCES — allow pages & experiences */
export function contentType<
  T extends Omit<BaseContentType<'_experience'>, 'mayContainTypes'> & {
    mayContainTypes?: ContentType<PageContentType | ExperienceContentType>[];
  }
>(options: T): T & { __type: 'contentType' };

/** SECTIONS — only sections */
export function contentType<T extends BaseContentType<'_section'>>(
  options: T
): T & { __type: 'contentType' };

/** MEDIA — only media types */
export function contentType<T extends BaseContentType<MediaStringTypes>>(
  options: T
): T & { __type: 'contentType' };

/** FOLDERS & ELEMENTS — only themselves */
export function contentType<T extends BaseContentType<'_folder' | '_element'>>(
  options: T
): T & { __type: 'contentType' };

/** GENERIC FALLBACK — any content type */
export function contentType<T extends AnyContentType>(
  options: T
): T & { __type: 'contentType' };

/** Implementation */
export function contentType<T extends AnyContentType>(
  options: T
): T & { __type: 'contentType' } {
  return { ...options, __type: 'contentType' };
}
