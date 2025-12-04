import { ExperienceComponentNode, ExperienceNode } from '../infer.js';
import {
  AnyContentType,
  MEDIA_BASE_TYPES,
  PermittedTypes,
  MediaStringTypes,
} from '../model/contentTypes.js';

/**
 * Get the key or name of ContentType or Media type
 * @param t ContentType or Media type property
 * @returns Name of the ContentType or Media type
 */
export function getKeyName(t: PermittedTypes | AnyContentType): string {
  if (typeof t === 'string') return t;
  return t.key;
}

/**
 * Check if the keyName is a built‑in CMS baseTypes
 * @param key keyName of the content type
 * @returns boolean
 */
export function isBaseType(key: string): boolean {
  return /^_/.test(key);
}

/**
 * Check if the keyName is a built-in CMS baseType.
 * @param key - The keyName of the content type.
 * @returns True if the key is a built-in CMS baseType format, otherwise return the original key.
 */
export function toBaseTypeFragmentKey(key: string): string {
  if (isBaseType(key)) {
    return `_${key.charAt(1).toUpperCase()}${key.slice(2)}`;
  }
  return key;
}

/**
 * Check if the keyName is a Media type
 * @param key keyName of the content type
 * @returns boolean
 */
export function isBaseMediaType(key: string): key is MediaStringTypes {
  return (MEDIA_BASE_TYPES as readonly string[]).includes(key);
}

export const CONTENT_URL_FRAGMENT =
  'fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }';

export const CONTENT_REFERENCE_ITEM_FRAGMENTS = [
  'fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }',
  'fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }',
  'fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }',
  'fragment ContentReferenceItem on ContentReference { item { ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }',
];

const COMMON_FRAGMENTS = [
  'fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }',
  'fragment ItemMetadata on ItemMetadata { changeset displayOption }',
  'fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }',
  CONTENT_URL_FRAGMENT,
  'fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }',
  'fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }',
];

const COMMON_FIELDS = '..._IContent';

/**
 * Generates and adds fragments for base types
 * @param damEnabled - Whether DAM features are enabled
 * @returns { fields, extraFragments }
 */
export function buildBaseTypeFragments(damEnabled: boolean = false) {
  const extraFragments = [...COMMON_FRAGMENTS];

  if (damEnabled) {
    extraFragments.push(...CONTENT_REFERENCE_ITEM_FRAGMENTS);
  }

  return {
    fields: [COMMON_FIELDS],
    extraFragments,
  };
}

export function isComponentNode(
  node: ExperienceNode
): node is ExperienceComponentNode {
  return node.__typename === 'CompositionComponentNode';
}
