import { AnyContentType } from '../model/contentTypes.js';
import { getContentType, RegistryEntry } from '../model/contentTypeRegistry.js';
import {
  isBaseType,
  toBaseTypeFragmentKey,
  stripSourcePrefix,
  DAM_ASSET_FRAGMENTS,
  getFixedFragments,
  getBaseTypeFragments,
} from '../util/baseTypeUtil.js';
import { withQueryCaching } from '../util/cache.js';
import { SemanticAttributes } from '../telemetry/index.js';
import {
  startFragmentSpan,
  startSingleQuerySpan,
  startMultipleQuerySpan,
} from '../telemetry/spans.js';
import {
  fragmentGenerationDuration,
  fragmentGenerationCount,
  queryGenerationDuration,
  queryGenerationCount,
  QueryType,
  recordMetrics,
} from '../telemetry/metrics.js';
import { GraphMissingContentTypeError, GraphQueryGenerationError } from './error.js';
import {
  isExperienceComponent,
  FragmentOptions,
  QueryContext,
  createQueryContext,
  convertProperty,
  getCachedContentTypes,
  refreshCache,
  FragmentInfo,
} from '../util/queryUtils.js';
import { isContract } from '../model/index.js';
import { isFormContentType } from '../model/formContentTypes.js';
import { DEFAULT_MAX_FRAGMENT_THRESHOLD, DEFAULT_EXPAND_CONTRACTS } from './constants.js';

// TYPE DEFINITIONS

/**
 * Result of fragment generation containing both the fragment strings and metadata.
 */
type FragmentResult = {
  fragments: string[];
  includesDamAssetsFragments: boolean;
};

export type ItemsResponse<T> = {
  _Content: {
    items: ({
      __typename: string;
      _metadata: {
        variation: string;
      };
    } & T)[];
  };
};

// EXPERIENCE FRAGMENTS

const buildFragmentsForKeys = (
  keys: string[],
  visited: Set<string>,
  ctx: QueryContext,
): FragmentResult => {
  const results = keys
    .filter(key => !visited.has(key))
    .map(key => createFragment(key, visited, '', ctx, { includeBaseFragments: true }));

  return {
    fragments: results.flatMap(r => r.fragments),
    includesDamAssetsFragments: results.some(r => r.includesDamAssetsFragments),
  };
};

const buildInterfaceFragment = (typeName: string, keys: string[]): string => {
  const nodeNames = keys.map(key => `...${key}`).join(' ');
  return `fragment ${typeName} on ${typeName} { __typename ${nodeNames} }`;
};

const createExperienceFragments = (
  visited: Set<string>,
  ctx: QueryContext,
  { includeExperienceFragment = true } = {},
): FragmentResult => {
  const experienceNodeKeys = getCachedContentTypes()
    .filter(isExperienceComponent)
    // `initForms` registers form types globally. Only include when forms are enabled.
    .filter(ct => ctx.formsEnabled || !isFormContentType(ct.key))
    .map(ct => ct.key);

  const experienceResult = buildFragmentsForKeys(experienceNodeKeys, visited, ctx);
  return {
    fragments: [
      ...getFixedFragments(ctx.formsEnabled, includeExperienceFragment),
      ...experienceResult.fragments,
      buildInterfaceFragment('_IComponent', experienceNodeKeys),
    ],
    includesDamAssetsFragments: experienceResult.includesDamAssetsFragments,
  };
};

/**
 * True for content types that hold a composition of their own.
 *
 * In Graph every `_Section` exposes a `composition` field, and a section-enabled
 * component is indexed as one — the Optimizely Forms container declares
 * `_component` with `sectionEnabled`, yet reports `_Section` among its types.
 */
const holdsComposition = (contentType: RegistryEntry): boolean => {
  if (!('baseType' in contentType)) return false;
  if (contentType.baseType === '_section') return true;

  if (!('compositionBehaviors' in contentType)) return false;
  const behaviors = contentType.compositionBehaviors;
  return Array.isArray(behaviors) && behaviors.includes('sectionEnabled');
};

// VALIDATION

const validateContentTypeName = (contentTypeName: string, visited: Set<string>): void => {
  if (!contentTypeName || contentTypeName === 'undefined' || contentTypeName === '*')
    throw new GraphQueryGenerationError({
      contentType: contentTypeName,
      parentContentType: visited.values().next().value,
    });
};

// FRAGMENT PROCESSING

const processUserTypeProperties = (
  contentType: AnyContentType,
  contentTypeName: string,
  suffix: string,
  visited: Set<string>,
  ctx: QueryContext,
): FragmentInfo => {
  const props = Object.entries(contentType.properties ?? {}).filter(
    ([, t]) => t.indexingType !== 'disabled',
  );

  const fields: string[] = [];
  const extraFragments: string[] = [];
  let includesDamAssetsFragments = false;

  for (const [propKey, prop] of props) {
    const result = convertProperty(propKey, prop, contentTypeName, suffix, visited, ctx);

    fields.push(...result.fields);
    extraFragments.push(...result.extraFragments);
    includesDamAssetsFragments =
      includesDamAssetsFragments || result.includesDamAssetsFragments;
  }

  return { fields, extraFragments, includesDamAssetsFragments };
};

const getParsedFragmentName = (
  contentTypeName: string,
  fragmentName: string,
  contentType: RegistryEntry | undefined,
): string => {
  if (isBaseType(contentTypeName)) return toBaseTypeFragmentKey(contentTypeName);
  // Namespaced external types (graph:, globalcontract:) resolve to the real Graph type, never the
  // fragment-name `Property` suffix (Graph only generates `<X>Property` types for local components).
  const bare = stripSourcePrefix(contentTypeName);
  const onType = bare !== contentTypeName ? bare : fragmentName;
  if (contentType && isContract(contentType))
    return onType.startsWith('_') ? `_I${onType.slice(1)}` : `I${onType}`;
  return onType;
};

const assembleFragment = (
  contentTypeName: string,
  fragmentName: string,
  contentType: RegistryEntry | undefined,
  fields: string[],
  extraFragments: string[],
  includesDamAssetsFragments: boolean,
): FragmentResult => {
  const parsedFragmentName = getParsedFragmentName(
    contentTypeName,
    fragmentName,
    contentType,
  );

  const allFragments =
    includesDamAssetsFragments ?
      [...DAM_ASSET_FRAGMENTS, ...extraFragments]
    : extraFragments;
  const uniqueFields = [...new Set(fields)].join(' ');
  const uniqueFragments = [...new Set(allFragments)];

  return {
    fragments: [
      ...uniqueFragments,
      `fragment ${fragmentName} on ${parsedFragmentName} { ${uniqueFields} }`,
    ],
    includesDamAssetsFragments,
  };
};

// FRAGMENT GENERATION

/**
 * Builds a GraphQL fragment for the requested content-type **and** returns every nested fragment it depends on.
 * @param contentTypeName Name/key of the content-type to expand.
 * @param visited Set of fragment names already on the stack.
 * @param suffix Optional suffix for the fragment name.
 * @param ctx Settings fixed for the whole query. Passed through recursion
 *   unchanged, so every fragment in the document agrees.
 * @param options Settings that may differ between one fragment and the next.
 * @returns Fragment result containing fragments array and DAM flag.
 */
export const createFragment = (
  contentTypeName: string,
  visited: Set<string> = new Set(),
  suffix: string = '',
  ctx: QueryContext = createQueryContext(),
  options: FragmentOptions = {},
): FragmentResult => {
  validateContentTypeName(contentTypeName, visited);

  const { damEnabled, maxFragmentThreshold } = ctx;
  const { includeBaseFragments = true } = options;

  const fragmentName = `${stripSourcePrefix(contentTypeName)}${suffix}`;

  if (visited.has(fragmentName))
    return { fragments: [], includesDamAssetsFragments: false };

  if (visited.size === 0) refreshCache();
  visited.add(fragmentName);

  // Create telemetry span only at root level (not for recursive calls)
  const isRootCall = visited.size === 1;
  const span =
    isRootCall ?
      startFragmentSpan(contentTypeName, damEnabled, maxFragmentThreshold, suffix)
    : undefined;
  const startTime = isRootCall ? performance.now() : 0;

  const fields: string[] = ['__typename'];
  const extraFragments: string[] = [];
  let includesDamAssetsFragments = false;
  let contentType: RegistryEntry | undefined;

  if (isBaseType(contentTypeName)) {
    const baseFragments = getBaseTypeFragments(contentTypeName);
    fields.push(...baseFragments.fields);
    extraFragments.push(...baseFragments.extraFragments);
  } else {
    contentType = getContentType(contentTypeName);
    if (!contentType) throw new GraphMissingContentTypeError(contentTypeName);

    // Process properties (contracts and content types both have properties)
    const propResult = processUserTypeProperties(
      contentType as AnyContentType,
      contentTypeName,
      suffix,
      visited,
      ctx,
    );
    fields.push(...propResult.fields);
    extraFragments.push(...propResult.extraFragments);
    includesDamAssetsFragments = propResult.includesDamAssetsFragments;

    // Namespaced external types don't implement _IContent — skip CMS base/content fragments.
    const isNamespaced = stripSourcePrefix(contentTypeName) !== contentTypeName;
    if (includeBaseFragments && !isNamespaced) {
      const baseType =
        'baseType' in contentType ? (contentType as AnyContentType).baseType : undefined;
      const baseFragments = getBaseTypeFragments(baseType ?? '', contentTypeName);
      extraFragments.unshift(...baseFragments.extraFragments);
      fields.push(...baseFragments.fields);
    }

    const isExperience =
      'baseType' in contentType && contentType.baseType === '_experience';

    // A section only fetches its own composition when queried directly;
    // nested in an experience, it already arrives via that composition tree.
    const isStandaloneSection =
      isRootCall && !isExperience && holdsComposition(contentType);

    if (isExperience || isStandaloneSection) {
      // `_IExperience` is an interface a section does not implement, so the
      // section reads the field directly instead of spreading the fragment.
      fields.push(
        isExperience ? '..._IExperience' : 'composition { ...ICompositionNode }',
      );

      const experienceResult = createExperienceFragments(visited, ctx, {
        includeExperienceFragment: isExperience,
      });
      extraFragments.push(...experienceResult.fragments);
      includesDamAssetsFragments =
        includesDamAssetsFragments || experienceResult.includesDamAssetsFragments;
    }
  }

  const result = assembleFragment(
    contentTypeName,
    fragmentName,
    contentType,
    fields,
    extraFragments,
    includesDamAssetsFragments,
  );

  if (span) {
    span.setAttribute(SemanticAttributes.OPTI_FRAGMENT_COUNT, result.fragments.length);

    recordMetrics(fragmentGenerationDuration, fragmentGenerationCount, startTime, {
      [SemanticAttributes.OPTI_CONTENT_TYPE]: contentTypeName,
      [SemanticAttributes.OPTI_DAM_ENABLED]: damEnabled,
      [SemanticAttributes.OPTI_FRAGMENT_THRESHOLD]: maxFragmentThreshold,
    });

    span.end();
  }

  return result;
};

// QUERY BUILDERS

/**
 * The public shape callers pass to the query builders: every field optional, so
 * a caller only states what it cares about. It is turned into a strict
 * {@linkcode QueryContext} once, at the boundary, and never rebuilt after that.
 */
export type QueryOptions = Partial<QueryContext> & FragmentOptions;

const generateSingleContentQuery = (
  contentType: string,
  options: QueryOptions = {},
): string => {
  const ctx = createQueryContext(options);
  const span = startSingleQuerySpan(contentType, ctx.damEnabled, ctx.formsEnabled);
  const startTime = span ? performance.now() : 0;

  const result = createFragment(contentType, new Set(), '', ctx, options);
  const fragments = result.fragments;
  const fragmentName = fragments.length > 0 ? '...' + contentType : '';

  const query = `
${fragments.join('\n')}
query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) {
    item {
      __typename
      ${fragmentName}
      _metadata {
        variation
      }
    }
  }
}
  `;

  if (span) {
    recordMetrics(queryGenerationDuration, queryGenerationCount, startTime, {
      [SemanticAttributes.OPTI_QUERY_TYPE]: QueryType.SINGLE,
      [SemanticAttributes.OPTI_CONTENT_TYPE]: contentType,
      [SemanticAttributes.OPTI_DAM_ENABLED]: ctx.damEnabled,
    });
    span.end();
  }

  return query;
};

/**
 * Generates a complete GraphQL query for fetching one item.
 *
 * @param contentType - The key of the content type to query.
 * @param options - Query metadata options controlling fragment and DAM behavior.
 * @returns A string representing the GraphQL query.
 */
export const createSingleContentQuery = withQueryCaching(
  'single',
  generateSingleContentQuery,
);

const generateMultipleContentQuery = (
  contentType: string,
  options: QueryOptions = {},
): string => {
  const ctx = createQueryContext(options);
  const span = startMultipleQuerySpan(contentType, ctx.damEnabled, ctx.formsEnabled);
  const startTime = span ? performance.now() : 0;

  const result = createFragment(contentType, new Set(), '', ctx, options);
  const fragments = result.fragments;
  const fragmentName = fragments.length > 0 ? '...' + contentType : '';

  const query = `
${fragments.join('\n')}
query ListContent($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) {
    items {
      __typename
      ${fragmentName}
      _metadata {
        variation
      }
    }
  }
}
  `;

  if (span) {
    recordMetrics(queryGenerationDuration, queryGenerationCount, startTime, {
      [SemanticAttributes.OPTI_QUERY_TYPE]: QueryType.MULTIPLE,
      [SemanticAttributes.OPTI_CONTENT_TYPE]: contentType,
      [SemanticAttributes.OPTI_DAM_ENABLED]: ctx.damEnabled,
    });
    span.end();
  }

  return query;
};

/**
 * Generates a complete GraphQL query for fetching multiple items.
 * All items must have the same content type.
 *
 * @param contentType - The key of the content type to query.
 * @param options - Query metadata options controlling fragment and DAM behavior.
 * @returns A string representing the GraphQL query.
 */
export const createMultipleContentQuery = withQueryCaching(
  'multiple',
  generateMultipleContentQuery,
);