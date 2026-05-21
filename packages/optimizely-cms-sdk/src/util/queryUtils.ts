import {
  AnyContentType,
  PermittedTypes,
  MAIN_BASE_TYPES,
} from '../model/contentTypes.js';
import {
  getAllContentTypes,
  getContentType,
  getContentTypeByBaseType,
  RegistryEntry,
} from '../model/contentTypeRegistry.js';
import { CONTENT_URL_FRAGMENT, getKeyName, isBaseType } from './baseTypeUtil.js';
import { AnyProperty } from '../model/properties.js';
import { checkTypeConstraintIssues } from './fragmentConstraintChecks.js';
import { createFragment } from '../graph/createQuery.js';

// TYPE DEFINITIONS

/**
 * Options for controlling GraphQL fragment generation behavior.
 */
export type FragmentOptions = {
  /**
   * Enable Digital Asset Management (DAM) support for contentReference properties.
   * When true, includes specialized fragments for DAM assets (images, videos, files).
   * @default false
   */
  damEnabled?: boolean;
  /**
   * Maximum number of fragments allowed before logging performance warnings.
   * Helps prevent excessive GraphQL query complexity from unrestricted content types.
   * @default 100
   */
  maxFragmentThreshold?: number;
  /**
   * Whether to include CMS base type fragments (e.g., _IContent, _IPage) in generated fragments.
   * Set to false for component property fragments that don't need base metadata.
   * @default true
   */
  includeBaseFragments?: boolean;
};

export type FragmentInfo = {
  fields: string[];
  extraFragments: string[];
  includesDamAssetsFragments: boolean;
};

export type PropertyHandler = (
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions,
) => FragmentInfo;

// CACHING

let allContentTypes: RegistryEntry[] = [];

/**
 * Retrieves cached content type definitions.
 */
export const getCachedContentTypes = (): RegistryEntry[] => {
  if (allContentTypes.length === 0) allContentTypes = getAllContentTypes();
  return allContentTypes;
};

/**
 * Refreshes the cached content type definitions.
 */
export const refreshCache = () => {
  allContentTypes = getAllContentTypes();
};

// CONTENT TYPE UTILITIES

const allPropertiesAreDisabled = (contentType: RegistryEntry): boolean => {
  if (!contentType?.properties) return false;
  const properties = Object.values(contentType.properties);
  return (
    properties.length > 0 &&
    properties.every(property => property?.indexingType === 'disabled')
  );
};

/**
 * Checks if a content type is an experience component.
 */
export const isExperienceComponent = (contentType: RegistryEntry): boolean =>
  'baseType' in contentType &&
  contentType.baseType === '_component' &&
  'compositionBehaviors' in contentType &&
  (contentType.compositionBehaviors?.length ?? 0) > 0;

// ALLOWED TYPES

const buildSkipSet = (restricted: PermittedTypes[] | undefined): Set<string> =>
  new Set(
    restricted?.flatMap(type => {
      const key = getKeyName(type);
      return isBaseType(key) ?
          [key, ...getContentTypeByBaseType(key).map(contentType => contentType.key)]
        : [key];
    }) ?? [],
  );

const shouldIncludeContentType = (
  contentType: PermittedTypes | AnyContentType,
  skipSet: Set<string>,
): boolean => {
  const key = getKeyName(contentType);
  if (skipSet.has(key) || MAIN_BASE_TYPES.includes(key as any)) return false;

  const contentTypeObj =
    typeof contentType === 'object' && 'key' in contentType ?
      contentType
    : getContentType(key);
  if (contentTypeObj && allPropertiesAreDisabled(contentTypeObj)) return false;

  return true;
};

const expandBaseType = (
  entry: PermittedTypes | AnyContentType,
  shouldExpandBaseTypes: boolean,
): (PermittedTypes | AnyContentType)[] => {
  const key = getKeyName(entry);

  if (shouldExpandBaseTypes && isBaseType(key))
    return [...getContentTypeByBaseType(key), entry];

  return [entry];
};

const resolveAllowedTypes = (
  allowed: PermittedTypes[] | undefined,
  restricted: PermittedTypes[] | undefined,
  cached: RegistryEntry[],
): (PermittedTypes | AnyContentType)[] => {
  const baseline = allowed?.length ? allowed : cached;
  const skipSet = buildSkipSet(restricted);
  const shouldExpandBaseTypes = !!allowed?.length;

  const seen = new Set<string>();

  return baseline
    .flatMap(entry => expandBaseType(entry, shouldExpandBaseTypes))
    .filter(contentType => {
      const key = getKeyName(contentType);
      if (seen.has(key)) return false;
      if (!shouldIncludeContentType(contentType, skipSet)) return false;
      seen.add(key);
      return true;
    });
};

// PROPERTY HANDLERS

const handleComponentProperty: PropertyHandler = (
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions,
) => {
  const { damEnabled = false, maxFragmentThreshold = 100 } = options;
  const key = (property as any).contentType.key;

  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;
  const fragmentName = `${key}Property`;
  const fields = [`${nameInFragment} { ...${fragmentName} }`];
  const result = createFragment(key, visited, 'Property', {
    damEnabled,
    maxFragmentThreshold,
    includeBaseFragments: false,
  });

  return {
    fields,
    extraFragments: result.fragments,
    includesDamAssetsFragments: result.includesDamAssetsFragments,
  };
};

const handleContentProperty: PropertyHandler = (
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions,
) => {
  const { damEnabled = false, maxFragmentThreshold = 100 } = options;
  const allowed = resolveAllowedTypes(
    (property as any).allowedTypes,
    (property as any).restrictedTypes,
    getCachedContentTypes(),
  );

  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;

  let includesDamAssetsFragments = false;
  const extraFragments = allowed.flatMap(type => {
    const key = getKeyName(type) === '_self' ? rootName : getKeyName(type);
    const result = createFragment(key, visited, '', {
      damEnabled,
      maxFragmentThreshold,
      includeBaseFragments: true,
    });
    includesDamAssetsFragments =
      includesDamAssetsFragments || result.includesDamAssetsFragments;
    return result.fragments;
  });

  const subfields = allowed.map(type => {
    const key = getKeyName(type);
    return `...${key === '_self' ? rootName : key}`;
  });
  const uniqueSubfields = ['__typename', ...new Set(subfields)].join(' ');
  const fields = [`${nameInFragment} { ${uniqueSubfields} }`];

  return { fields, extraFragments, includesDamAssetsFragments };
};

const handleRichTextProperty: PropertyHandler = (
  name: string,
  _property: AnyProperty,
  rootName: string,
  suffix: string,
  _visited: Set<string>,
  _options: FragmentOptions,
) => ({
  fields: [`${rootName}${suffix}__${name}:${name} { html, json }`],
  extraFragments: [],
  includesDamAssetsFragments: false,
});

const handleUrlProperty: PropertyHandler = (
  name: string,
  _property: AnyProperty,
  rootName: string,
  suffix: string,
  _visited: Set<string>,
  _options: FragmentOptions,
) => ({
  fields: [`${rootName}${suffix}__${name}:${name} { ...ContentUrl }`],
  extraFragments: [CONTENT_URL_FRAGMENT],
  includesDamAssetsFragments: false,
});

const handleLinkProperty: PropertyHandler = (
  name: string,
  _property: AnyProperty,
  rootName: string,
  suffix: string,
  _visited: Set<string>,
  _options: FragmentOptions,
) => ({
  fields: [
    `${rootName}${suffix}__${name}:${name} { text title target url { ...ContentUrl }}`,
  ],
  extraFragments: [CONTENT_URL_FRAGMENT],
  includesDamAssetsFragments: false,
});

const handleContentReferenceProperty: PropertyHandler = (
  name: string,
  _property: AnyProperty,
  _rootName: string,
  _suffix: string,
  _visited: Set<string>,
  options: FragmentOptions,
) => {
  const { damEnabled = false } = options;

  const itemFragment = damEnabled ? ' ...ContentReferenceItem' : '';

  return {
    fields: [`${name} { key url { ...ContentUrl }${itemFragment} }`],
    extraFragments: [CONTENT_URL_FRAGMENT],
    includesDamAssetsFragments: damEnabled,
  };
};

const handleArrayProperty: PropertyHandler = (
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions,
) => {
  const { damEnabled = false, maxFragmentThreshold = 100 } = options;

  return convertProperty(name, (property as any).items, rootName, suffix, visited, {
    damEnabled,
    maxFragmentThreshold,
  });
};

const handleScalarProperty: PropertyHandler = (
  name: string,
  _property: AnyProperty,
  rootName: string,
  suffix: string,
  _visited: Set<string>,
  _options: FragmentOptions,
) => ({
  fields: [`${rootName}${suffix}__${name}:${name}`],
  extraFragments: [],
  includesDamAssetsFragments: false,
});

const PROPERTY_HANDLERS: Record<string, PropertyHandler> = {
  component: handleComponentProperty,
  content: handleContentProperty,
  richText: handleRichTextProperty,
  url: handleUrlProperty,
  link: handleLinkProperty,
  contentReference: handleContentReferenceProperty,
  array: handleArrayProperty,
};

// PROPERTY CONVERSION

const convertPropertyField: PropertyHandler = (
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions = {},
) => {
  const handler = PROPERTY_HANDLERS[property.type] ?? handleScalarProperty;

  const result = handler(name, property, rootName, suffix, visited, options);

  return {
    ...result,
    extraFragments: [...new Set(result.extraFragments)],
  };
};

/**
 * Converts a property definition into GraphQL fields and fragments.
 */
export const convertProperty: PropertyHandler = (
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions = {},
) => {
  const { maxFragmentThreshold = 100 } = options;
  const result = convertPropertyField(name, property, rootName, suffix, visited, options);

  const warningMessage = checkTypeConstraintIssues(
    rootName,
    property,
    result,
    maxFragmentThreshold,
  );
  if (warningMessage) console.warn(warningMessage);

  return result;
};
