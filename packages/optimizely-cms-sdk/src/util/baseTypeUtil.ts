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

export function isComponentNode(
  node: ExperienceNode
): node is ExperienceComponentNode {
  return node.__typename === 'CompositionComponentNode';
}
