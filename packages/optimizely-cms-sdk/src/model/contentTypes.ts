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

// Literal union of baseType strings
export type BaseTypes = (typeof ALL_BASE_TYPES)[number];
// Literal union of media baseType strings
export type MediaStringTypes = (typeof MEDIA_BASE_TYPES)[number];
// Literal union of other baseType strings
export type OtherBaseTypes = (typeof OTHER_BASE_TYPES)[number];

/**
 * Defines the allowed types for the mayContainTypes property based on the provided baseType.
 * - For '_page' and '_experience', mayContainTypes can include arrays of page, experience, or folder content types.
 * - For '_component', mayContainTypes can include arrays of component content types.
 * - For '_folder', mayContainTypes can include arrays of any content type.
 * - For other baseTypes, mayContainTypes is not permitted.
 * This approach prevents circular references by referencing base content types directly.
 */
type AllowedMayContain<T extends BaseTypes> = T extends '_page' | '_experience'
  ? Array<
      ContentType<
        | BaseContentType<'_page'>
        | BaseContentType<'_experience'>
        | BaseContentType<'_folder'>
      >
    >
  : T extends '_component'
  ? Array<ContentType<BaseContentType<'_component'>>>
  : T extends '_folder'
  ? Array<ContentType<AnyContentType>>
  : never;

/**
 * Base content type, now generic in its own baseType
 */
export type BaseContentType<B extends BaseTypes> = {
  key: string;
  baseType: B;
  displayName?: string;
  properties?: Record<string, AnyProperty>;
  mayContainTypes?: AllowedMayContain<B>;
};

/** Other content types (page, folder, element) */
export type OtherContentTypes = BaseContentType<OtherBaseTypes>;

/** Media content types (image, media, video) */
export type MediaContentType = BaseContentType<MediaStringTypes>;

/** Component content type */
export type ComponentContentType = BaseContentType<'_component'> & {
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};

/** Experience content type */
export type ExperienceContentType = BaseContentType<'_experience'>;

/** Section content type */
export type SectionContentType = BaseContentType<'_section'>;

/** Union of all content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | SectionContentType
  | OtherContentTypes
  | MediaContentType;

/** ContentType wrapper adding __type marker */
export type ContentType<T extends AnyContentType> = T & {
  __type: 'contentType';
};

/** Permitted types: either a wrapped ContentType or just a baseType string */
export type PermittedTypes =
  | ContentType<AnyContentType>
  | AnyContentType['baseType'];
