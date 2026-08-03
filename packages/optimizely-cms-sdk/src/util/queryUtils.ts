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
import {
  CONTENT_URL_FRAGMENT,
  getKeyName,
  isBaseType,
  stripSourcePrefix,
} from './baseTypeUtil.js';
import { AnyProperty } from '../model/properties.js';
import { checkTypeConstraintIssues } from './fragmentConstraintChecks.js';
import { createFragment } from '../graph/createQuery.js';
import { isContract, findExtendingContentTypes } from '../model/index.js';
import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
} from '../graph/constants.js';

const getImplementedContracts = (contentType: AnyContentType): RegistryEntry[] => {
  if (!contentType.extends) return [];
  return Array.isArray(contentType.extends) ? contentType.extends : [contentType.extends];
};

const collectContracts = (type: RegistryEntry): string[] =>
  getImplementedContracts(type as AnyContentType)
    .filter((c): c is RegistryEntry => isContract(c))
    .map(c => c.key);

const collectTypesAndContracts = (
  allowed: (PermittedTypes | AnyContentType)[],
  rootName: string,
) => {
  const typesToInclude = new Set(
    allowed.map(type => (getKeyName(type) === '_self' ? rootName : getKeyName(type))),
  );

  const contractsToInclude = new Set<string>();

  allowed.forEach(type => {
    if (typeof type === 'object' && !isContract(type) && 'extends' in type) {
      collectContracts(type).forEach(key => contractsToInclude.add(key));
    } else if (isContract(type)) {
      findExtendingContentTypes(type)
        .flatMap(collectContracts)
        .forEach(contractKey => {
          if (contractKey !== type.key) {
            contractsToInclude.add(contractKey);
          }
        });
    }
  });

  return { typesToInclude, contractsToInclude };
};

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
   * Maximum number of fragments allowed before throwing an error.
   * Prevents excessive GraphQL query complexity from unrestricted content types.
   */
  maxFragmentThreshold?: number;
  /**
   * Enable or disable contract expansion.
   * When true, contracts are expanded to include all implementing types.
   * When false, only the contract itself is included without expansion.
   */
  expandContracts?: boolean;
  /**
   * Whether to include CMS base type fragments (e.g., _IContent, _IPage) in generated fragments.
   * Set to false for component property fragments that don't need base metadata.
   * @default true
   */
  includeBaseFragments?: boolean;
  /**
   * Optional filter to exclude content types from fragment generation.
   * Return true to include a content type, false to exclude it.
   * Useful for skipping content types that have no registered component.
   */
  typeFilter?: (contentTypeKey: string) => boolean;
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

const expandContract = (
  entry: PermittedTypes | AnyContentType,
  expandContracts: boolean = DEFAULT_EXPAND_CONTRACTS,
): (PermittedTypes | AnyContentType)[] => {
  if (typeof entry === 'object' && isContract(entry)) {
    if (!expandContracts) return [entry];
    const extendingTypes = findExtendingContentTypes(entry);
    return [entry, ...extendingTypes];
  }

  return [entry];
};

const resolveAllowedTypes = (
  allowed: PermittedTypes[] | undefined,
  restricted: PermittedTypes[] | undefined,
  cached: RegistryEntry[],
  expandContracts: boolean = DEFAULT_EXPAND_CONTRACTS,
): (PermittedTypes | AnyContentType)[] => {
  const baseline = allowed?.length ? allowed : cached;
  const skipSet = buildSkipSet(restricted);
  const shouldExpandBaseTypes = !!allowed?.length;

  const seen = new Set<string>();

  return baseline
    .flatMap(entry => expandContract(entry, expandContracts))
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
  const { damEnabled = false, maxFragmentThreshold = DEFAULT_MAX_FRAGMENT_THRESHOLD } =
    options;
  const key = (property as any).contentType.key;

  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;
  const fragmentName = `${stripSourcePrefix(key)}Property`;
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
  const {
    damEnabled = false,
    maxFragmentThreshold = DEFAULT_MAX_FRAGMENT_THRESHOLD,
    expandContracts = DEFAULT_EXPAND_CONTRACTS,
    typeFilter,
  } = options;
  const resolved = resolveAllowedTypes(
    (property as any).allowedTypes,
    (property as any).restrictedTypes,
    getCachedContentTypes(),
    expandContracts,
  );
  const allowed = typeFilter ? resolved.filter(type => typeFilter(getKeyName(type))) : resolved;

  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;

  const { typesToInclude, contractsToInclude } = collectTypesAndContracts(
    allowed,
    rootName,
  );

  const createFragmentFor = (key: string) => {
    const result = createFragment(key, visited, '', {
      damEnabled,
      maxFragmentThreshold,
      expandContracts,
      includeBaseFragments: true,
      typeFilter,
    });
    return result;
  };

  let includesDamAssetsFragments = false;
  const extraFragments: string[] = [];
  const subfields = ['__typename'];

  typesToInclude.forEach(key => {
    const result = createFragmentFor(key);
    includesDamAssetsFragments =
      includesDamAssetsFragments || result.includesDamAssetsFragments;
    extraFragments.push(...result.fragments);
    subfields.push(`...${stripSourcePrefix(key)}`);
  });

  contractsToInclude.forEach(contractKey => {
    const result = createFragmentFor(contractKey);
    includesDamAssetsFragments =
      includesDamAssetsFragments || result.includesDamAssetsFragments;
    extraFragments.push(...result.fragments);
    subfields.push(`...${stripSourcePrefix(contractKey)}`);
  });

  const uniqueSubfields = [...new Set(subfields)].join(' ');
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
  const {
    damEnabled = false,
    maxFragmentThreshold = DEFAULT_MAX_FRAGMENT_THRESHOLD,
    typeFilter,
  } = options;

  return convertProperty(name, (property as any).items, rootName, suffix, visited, {
    damEnabled,
    maxFragmentThreshold,
    typeFilter,
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
  // Remove the namespace prefix (e.g. `graph:`) from rootName so field aliases
  // (`{rootName}__{field}`) match the GraphQL __typename, which has no prefix.
  rootName = stripSourcePrefix(rootName);
  const { maxFragmentThreshold = DEFAULT_MAX_FRAGMENT_THRESHOLD } = options;
  const result = convertPropertyField(name, property, rootName, suffix, visited, options);

  checkTypeConstraintIssues(rootName, property, result, maxFragmentThreshold);

  return result;
};
