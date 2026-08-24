import { ExperienceComponentNode, ExperienceNode } from '../infer.js';
import {
  AnyContentType,
  MEDIA_BASE_TYPES,
  PermittedTypes,
  MediaStringTypes,
} from '../model/contentTypes.js';

export type BaseTypeFragments = {
  fields: string[];
  extraFragments: string[];
};

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

/**
 * Removes the namespace prefix from a content type key (e.g. `graph:Article` becomes `Article`).
 * Used for GraphQL type names, which can't contain a colon.
 * @param key - The content type key, possibly namespaced.
 * @returns Key without the leading `namespace:` prefix.
 */
export const stripSourcePrefix = (key: string): string => key.replace(/^[a-z]+:/i, '');

/**
 * Generates nested composition node structure for given depth.
 * @param depth - Current nesting level (0 = deepest).
 * @returns Nested fragment string.
 *
 * NOTE: Temporary workaround for Graph issue with @recursive directive.
 * This function will not be used once Graph properly supports @recursive.
 */
function buildNestedCompositionNodes(depth: number): string {
  const baseFields =
    '__typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value}';

  if (depth === 0) {
    return baseFields;
  }

  const nested = buildNestedCompositionNodes(depth - 1);
  return `${baseFields} ...on CompositionStructureNode { component { ..._IComponent } nodes { ${nested} ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } }`;
}

/** Nesting depth that covers ordinary experience compositions. */
const COMPOSITION_NESTING_DEPTH = 4;

/**
 * Forms nest deeper than an ordinary composition — steps hold rows, which hold
 * columns, which hold elements — so they need more levels. Applied only when
 * Forms is enabled, because every extra level lengthens every query.
 */
const FORMS_COMPOSITION_NESTING_DEPTH = 8;

// FRAGMENT CONSTANTS

export const CONTENT_URL_FRAGMENT =
  'fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }';

export const DAM_ASSET_FRAGMENTS = [
  'fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }',
  'fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }',
  'fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }',
  'fragment ContentReferenceItem on ContentReference { item { __typename ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }',
];

/**
 * Fragments included in every query that walks a composition.
 *
 * @param formsEnabled Use the deeper composition nesting that Forms requires.
 * @param includeExperienceFragment Emit `_IExperience` too. A section reads its
 *   `composition` field directly rather than spreading that fragment, and
 *   GraphQL rejects a document containing a fragment nothing uses.
 */
export const getFixedFragments = (
  formsEnabled = false,
  includeExperienceFragment = true,
) => [
  ...(includeExperienceFragment ?
    ['fragment _IExperience on _IExperience { composition {...ICompositionNode }}']
  : []),
  // This is a temporary workaround for Graph issue with @recursive directive. This will not be used once Graph properly supports @recursive.
  // Replace it with a simpler recursive fragment once Graph supports @recursive, e.g. 'fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }':
  `fragment ICompositionNode on ICompositionNode { ${buildNestedCompositionNodes(
    formsEnabled ? FORMS_COMPOSITION_NESTING_DEPTH : COMPOSITION_NESTING_DEPTH,
  )} }`,
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

export function getBaseTypeFragments(
  baseType: string,
  contentTypeName?: string,
): BaseTypeFragments {
  const prefix =
    contentTypeName && !isBaseType(contentTypeName) ? `${contentTypeName}__` : '';

  if (baseType === '_image') {
    return {
      fields: [
        COMMON_FIELDS,
        `${prefix}assetMetadata:_assetMetadata { fileSize mimeType url }`,
        `${prefix}imageMetadata:_imageMetadata { width height }`,
      ],
      extraFragments: [...COMMON_FRAGMENTS],
    };
  }
  if (isBaseMediaType(baseType)) {
    return {
      fields: [
        COMMON_FIELDS,
        `${prefix}assetMetadata:_assetMetadata { fileSize mimeType url }`,
      ],
      extraFragments: [...COMMON_FRAGMENTS],
    };
  }
  return {
    fields: [COMMON_FIELDS],
    extraFragments: [...COMMON_FRAGMENTS],
  };
}
