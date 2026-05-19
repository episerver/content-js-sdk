import {
  AnyContentType,
  PermittedTypes,
  MAIN_BASE_TYPES,
} from '../model/contentTypes.js';
import {
  getAllContentTypes,
  getContentType,
  getContentTypeByBaseType,
} from '../model/contentTypeRegistry.js';
import { CONTENT_URL_FRAGMENT, getKeyName, isBaseType } from './baseTypeUtil.js';
import { createFragment } from '../graph/createQuery.js';
import { AnyProperty } from '../model/properties.js';
import { checkTypeConstraintIssues } from './fragmentConstraintChecks.js';

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

let allContentTypes: AnyContentType[] = [];

/**
 * Retrieves and caches all content type definitions.
 * Avoids repeated calls to the content registry.
 * @returns An array of all contentType definitions.
 */
export const getCachedContentTypes = (): AnyContentType[] => {
  if (allContentTypes.length === 0) {
    allContentTypes = getAllContentTypes();
  }
  return allContentTypes;
};

/**
 * Forces a refresh of the cached content type definitions.
 */
export const refreshCache = () => {
  allContentTypes = getAllContentTypes();
};

// CONTENT TYPE UTILITIES

const allPropertiesAreDisabled = (ct: AnyContentType): boolean => {
  if (!ct?.properties) return false;
  const properties = Object.values(ct.properties);
  return (
    properties.length > 0 && properties.every(prop => prop?.indexingType === 'disabled')
  );
};

export const isExperienceComponent = (ct: AnyContentType): boolean =>
  ct.baseType === '_component' &&
  'compositionBehaviors' in ct &&
  (ct.compositionBehaviors?.length ?? 0) > 0;

// ALLOWED TYPES

const buildSkipSet = (restricted: PermittedTypes[] | undefined): Set<string> =>
  new Set(
    restricted?.flatMap(r => {
      const key = getKeyName(r);
      return isBaseType(key) ?
          [key, ...getContentTypeByBaseType(key).map(ct => ct.key)]
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

/**
 * Resolves the set of allowed content types for a property, excluding restricted and recursive entries.
 * @param allowed - Explicit allow list of types.
 * @param restricted - Explicit deny list of types.
 * @returns An array of allowed content types for fragment generation.
 */
const resolveAllowedTypes = (
  allowed: PermittedTypes[] | undefined,
  restricted: PermittedTypes[] | undefined,
  cached: AnyContentType[],
): (PermittedTypes | AnyContentType)[] => {
  const baseline = allowed?.length ? allowed : cached;
  const skipSet = buildSkipSet(restricted);
  const shouldExpandBaseTypes = !!allowed?.length;

  const seen = new Set<string>();

  return baseline
    .flatMap(entry => expandBaseType(entry, shouldExpandBaseTypes))
    .filter(ct => {
      const key = getKeyName(ct);
      if (seen.has(key)) return false;
      if (!shouldIncludeContentType(ct, skipSet)) return false;
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
  const extraFragments = createFragment(key, visited, 'Property', {
    damEnabled,
    maxFragmentThreshold,
    includeBaseFragments: false,
  });

  return { fields, extraFragments, includesDamAssetsFragments: false };
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
  const extraFragments = allowed.flatMap(t => {
    const key = getKeyName(t) === '_self' ? rootName : getKeyName(t);
    return createFragment(key, visited, '', {
      damEnabled,
      maxFragmentThreshold,
      includeBaseFragments: true,
    });
  });
  const subfields = allowed.map(t => {
    const key = getKeyName(t);
    return `...${key === '_self' ? rootName : key}`;
  });

  const uniqueSubfields = ['__typename', ...new Set(subfields)].join(' ');
  const fields = [`${nameInFragment} { ${uniqueSubfields} }`];

  return { fields, extraFragments, includesDamAssetsFragments: false };
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
 * Logs warnings for potential performance or recursion issues based on configuration.
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

