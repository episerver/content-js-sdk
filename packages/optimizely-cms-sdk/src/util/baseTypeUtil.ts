import { ExperienceComponentNode, ExperienceNode } from '../infer.js';
import {
  AnyContentType,
  MEDIA_BASE_TYPES,
  PermittedTypes,
  MediaStringTypes,
} from '../model/contentTypes.js';

// TYPE CHECKING

/**
 * Check if the keyName is a built‑in CMS baseTypes
 * @param key keyName of the content type
 * @returns boolean
 */
export const isBaseType = (key: string): boolean => /^_/.test(key);

/**
 * Check if the keyName is a Media type
 * @param key keyName of the content type
 * @returns boolean
 */
export const isBaseMediaType = (key: string): key is MediaStringTypes =>
  (MEDIA_BASE_TYPES as readonly string[]).includes(key);

/**
 * Check if the node is a component node
 * @param node - The experience node to check
 * @returns True if the node is a component node
 */
export const isComponentNode = (node: ExperienceNode): node is ExperienceComponentNode =>
  node.__typename === 'CompositionComponentNode';

// KEY UTILITIES

/**
 * Get the key or name of ContentType or Media type
 * @param type ContentType or Media type property
 * @returns Name of the ContentType or Media type
 */
export const getKeyName = (type: PermittedTypes | AnyContentType): string =>
  typeof type === 'string' ? type : type.key;

/**
 * Check if the keyName is a built-in CMS baseType.
 * @param key - The keyName of the content type.
 * @returns True if the key is a built-in CMS baseType format, otherwise return the original key.
 */
export const toBaseTypeFragmentKey = (key: string): string =>
  isBaseType(key) ? `_${key.charAt(1).toUpperCase()}${key.slice(2)}` : key;

// FRAGMENT CONSTANTS

export const CONTENT_URL_FRAGMENT =
  'fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }';

export const DAM_ASSET_FRAGMENTS = [
  'fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }',
  'fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }',
  'fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }',
  'fragment ContentReferenceItem on ContentReference { item { __typename ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }',
];

export const FIXED_FRAGMENTS = [
  'fragment _IExperience on _IExperience { composition {...ICompositionNode }}',
  'fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }',
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

export const BASE_TYPE_FRAGMENTS = {
  fields: [COMMON_FIELDS],
  extraFragments: [...COMMON_FRAGMENTS],
};
