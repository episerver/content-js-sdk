import {
  AnyContentType,
  ContentOrMediaType,
  MediaStringTypes,
} from '../model/contentTypes';

export const BASE_MEDIA_TYPE: MediaStringTypes[] = [
  '_Image',
  '_Media',
  '_Video',
];
export const CUSTOM_MEDIA_TYPE: string[] = ['image', 'media', 'video'];

/**
 * Get the key or name of ContentType or Media type
 * @param t ContentType or Media type property
 * @returns Name of the ContentType or Media type
 */
export function getKeyName(t: ContentOrMediaType | AnyContentType): string {
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
 * Check if the keyName is a Media type
 * @param key keyName of the content type
 * @returns boolean
 */
export function isBaseMediaType(key: MediaStringTypes): boolean {
  return BASE_MEDIA_TYPE.includes(key);
}

/**
 * Check if the baseType is a custom media type
 * @param ct any user defined content type
 * @returns boolean
 */
export function isCustomMediaType(ct: AnyContentType): boolean {
  return CUSTOM_MEDIA_TYPE.includes(ct.baseType);
}

/** Common media meta‑data fragment */
export const MEDIA_METADATA_FRAGMENT =
  'fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }';

/** Common media meta‑data block */
export const COMMON_MEDIA_METADATA_BLOCK = '_metadata { ...mediaMetaData }';

/**
 * Generates and adds framents for base types
 * @param baseTypeName name of the base content type
 * @returns { fields, extraFragments }
 */
export function buildBaseTypeFragments(baseType: MediaStringTypes) {
  // note: Will add more support for other baseTypes later. For now its only media types
  if (isBaseMediaType(baseType)) {
    return {
      fields: [COMMON_MEDIA_METADATA_BLOCK],
      extraFragments: [MEDIA_METADATA_FRAGMENT],
    };
  }
  return { fields: [], extraFragments: [] };
}
