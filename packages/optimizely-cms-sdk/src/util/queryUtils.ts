import {
  AnyContentType,
  PermittedTypes,
  MAIN_BASE_TYPES,
} from '../model/contentTypes.js';
import {
  getAllContentTypes,
  getContentType,
  getContentTypeByBaseType,
  getRegistryVersion,
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
import { isFormContentType } from '../model/formContentTypes.js';
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
 * Settings that are fixed for a whole query.
 *
 * These must hold identically everywhere in one document. Shared fragments such
 * as `ICompositionNode` are emitted once per experience under a single global
 * name, so a value that differed between two levels of recursion would produce
 * two conflicting definitions and Graph would reject the query.
 *
 * Every field is **required** on purpose. Recursion passes this object through
 * unchanged rather than rebuilding it, and required fields mean a site that
 * rebuilds it and forgets one fails to compile instead of silently falling back
 * to a default.
 */
export type QueryContext = {
  /**
   * Enable Digital Asset Management (DAM) support for contentReference properties.
   * Auto-detected from GraphQL schema introspection.
   */
  damEnabled: boolean;
  /**
   * Maximum number of fragments allowed before throwing an error.
   * Prevents excessive GraphQL query complexity from unrestricted content types.
   */
  maxFragmentThreshold: number;
  /**
   * Enable or disable contract expansion.
   * When true, contracts are expanded to include all implementing types.
   * When false, only the contract itself is included without expansion.
   */
  expandContracts: boolean;
  /**
   * Enable Optimizely Forms support.
   * Auto-detected from GraphQL schema introspection.
   */
  formsEnabled: boolean;
  /**
   * Optional filter to exclude content types from fragment generation.
   * Return true to include a content type, false to exclude it.
   * Useful for skipping content types that have no registered component.
   */
  typeFilter?: (contentTypeKey: string) => boolean;
};

/**
 * Settings that legitimately differ between one fragment and the next.
 *
 * Kept apart from {@linkcode QueryContext} so it stays obvious which values may
 * vary per call and which may not.
 */
export type FragmentOptions = {
  /**
   * Whether to include CMS base type fragments (e.g., _IContent, _IPage) in generated fragments.
   * Set to false for component property fragments that don't need base metadata.
   * @default true
   */
  includeBaseFragments?: boolean;
};

/** Fills in the defaults for the settings a caller may leave out. */
export const createQueryContext = (
  options: Partial<QueryContext> = {},
): QueryContext => ({
  damEnabled: options.damEnabled ?? false,
  maxFragmentThreshold: options.maxFragmentThreshold ?? DEFAULT_MAX_FRAGMENT_THRESHOLD,
  expandContracts: options.expandContracts ?? DEFAULT_EXPAND_CONTRACTS,
  formsEnabled: options.formsEnabled ?? false,
  typeFilter: options.typeFilter,
});

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
  ctx: QueryContext,
) => FragmentInfo;

// CACHING

let allContentTypes: RegistryEntry[] = [];
let cachedVersion = -1;

/**
 * Retrieves cached content type definitions.
 *
 * Keyed on the registry version rather than on the cache being empty: the
 * registry can be added to (by `initForms`) or replaced (by
 * `initContentTypeRegistry`) after the first query has already been generated.
 */
export const getCachedContentTypes = (): RegistryEntry[] => {
  if (cachedVersion !== getRegistryVersion()) refreshCache();
  return allContentTypes;
};

/**
 * Refreshes the cached content type definitions.
 */
export const refreshCache = () => {
  allContentTypes = getAllContentTypes();
  cachedVersion = getRegistryVersion();
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
  ((contentType.baseType === '_component' &&
    'compositionBehaviors' in contentType &&
    (contentType.compositionBehaviors?.length ?? 0) > 0) ||
    (contentType.baseType === '_section' && contentType.properties !== undefined));

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
  includeFormTypes: boolean = true,
): (PermittedTypes | AnyContentType)[] => {
  const hasWildcard = allowed?.includes('*');
  const baseline = hasWildcard || !allowed?.length ? cached : allowed;
  const skipSet = buildSkipSet(restricted);
  const shouldExpandBaseTypes = !!allowed?.length && !hasWildcard;

  // Types the content model names outright, as opposed to ones pulled in by a
  // wildcard or a base type. Asking for a form by name always wins.
  const namedKeys = new Set(
    (allowed ?? []).filter(entry => entry !== '*').map(entry => getKeyName(entry)),
  );

  const seen = new Set<string>();

  return baseline
    .flatMap(entry => expandContract(entry, expandContracts))
    .flatMap(entry => expandBaseType(entry, shouldExpandBaseTypes))
    .filter(contentType => {
      const key = getKeyName(contentType);
      if (seen.has(key)) return false;
      // A content area of `['*']` or `['_component']` would otherwise drag every
      // form type into the query on pages that have no form.
      if (!includeFormTypes && !namedKeys.has(key) && isFormContentType(key))
        return false;
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
  ctx: QueryContext,
) => {
  const key = (property as any).contentType.key;

  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;
  const fragmentName = `${stripSourcePrefix(key)}Property`;
  const fields = [`${nameInFragment} { ...${fragmentName} }`];
  const result = createFragment(key, visited, 'Property', ctx, {
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
  ctx: QueryContext,
) => {
  const { expandContracts, typeFilter } = ctx;
  const resolved = resolveAllowedTypes(
    (property as any).allowedTypes,
    (property as any).restrictedTypes,
    getCachedContentTypes(),
    expandContracts,
    ctx.formsEnabled,
  );
  const allowed =
    typeFilter ? resolved.filter(type => typeFilter(getKeyName(type))) : resolved;

  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;

  const { typesToInclude, contractsToInclude } = collectTypesAndContracts(
    allowed,
    rootName,
  );

  const createFragmentFor = (key: string) => {
    return createFragment(key, visited, '', ctx, { includeBaseFragments: true });
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
  _ctx: QueryContext,
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
  _ctx: QueryContext,
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
  _ctx: QueryContext,
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
  ctx: QueryContext,
) => {
  const { damEnabled } = ctx;

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
  ctx: QueryContext,
) => {
  // Forwards the whole context, which covers main's fix for `expandContracts`
  // being dropped here (CMS-54935) along with every other query-wide setting.
  return convertProperty(name, (property as any).items, rootName, suffix, visited, ctx);
};

const handleScalarProperty: PropertyHandler = (
  name: string,
  _property: AnyProperty,
  rootName: string,
  suffix: string,
  _visited: Set<string>,
  _ctx: QueryContext,
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
  ctx: QueryContext = createQueryContext(),
) => {
  const handler = PROPERTY_HANDLERS[property.type] ?? handleScalarProperty;

  const result = handler(name, property, rootName, suffix, visited, ctx);

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
  ctx: QueryContext = createQueryContext(),
) => {
  // Remove the namespace prefix (e.g. `graph:`) from rootName so field aliases
  // (`{rootName}__{field}`) match the GraphQL __typename, which has no prefix.
  rootName = stripSourcePrefix(rootName);
  const { maxFragmentThreshold } = ctx;
  const result = convertPropertyField(name, property, rootName, suffix, visited, ctx);

  checkTypeConstraintIssues(rootName, property, result, maxFragmentThreshold);

  return result;
};
