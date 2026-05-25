import { AnyContentType } from '../model/contentTypes.js';
import { getContentType, RegistryEntry } from '../model/contentTypeRegistry.js';
import {
  isBaseType,
  toBaseTypeFragmentKey,
  DAM_ASSET_FRAGMENTS,
  FIXED_FRAGMENTS,
  BASE_TYPE_FRAGMENTS,
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
  convertProperty,
  getCachedContentTypes,
  refreshCache,
  FragmentInfo,
} from '../util/queryUtils.js';
import { isContract } from '../model/index.js';

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

/**
 * Builds experience GraphQL fragments and their dependencies.
 * @param visited - Set of fragment names already visited to avoid cycles.
 * @param options - Fragment generation options.
 * @returns An object containing fragment strings and DAM usage flag.
 */
const createExperienceFragments = (
  visited: Set<string>,
  options: FragmentOptions = {},
): FragmentResult => {
  const experienceNodeKeys = getCachedContentTypes()
    .filter(isExperienceComponent)
    .map(contentType => contentType.key);

  const { fragments, includesDamAssetsFragments } = experienceNodeKeys
    .filter(key => !visited.has(key))
    .flatMap(key =>
      createFragment(key, visited, '', { ...options, includeBaseFragments: true }),
    )
    .reduce(
      (acc, result) => ({
        fragments: [...acc.fragments, ...result.fragments],
        includesDamAssetsFragments:
          acc.includesDamAssetsFragments || result.includesDamAssetsFragments,
      }),
      { fragments: [], includesDamAssetsFragments: false } as FragmentResult,
    );

  const nodeNames = experienceNodeKeys.map(key => `...${key}`).join(' ');
  const componentFragment = `fragment _IComponent on _IComponent { __typename ${nodeNames} }`;

  return {
    fragments: [...FIXED_FRAGMENTS, ...fragments, componentFragment],
    includesDamAssetsFragments,
  };
};

// VALIDATION

const validateContentTypeName = (contentTypeName: string, visited: Set<string>): void => {
  if (!contentTypeName || contentTypeName === 'undefined')
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
  options: FragmentOptions,
): FragmentInfo => {
  const { damEnabled = false, maxFragmentThreshold = 100 } = options;
  const props = Object.entries(contentType.properties ?? {}).filter(
    ([, t]) => t.indexingType !== 'disabled',
  );

  const fields: string[] = [];
  const extraFragments: string[] = [];
  let includesDamAssetsFragments = false;

  for (const [propKey, prop] of props) {
    const result = convertProperty(propKey, prop, contentTypeName, suffix, visited, {
      damEnabled,
      maxFragmentThreshold,
    });

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
  if (contentType && isContract(contentType)) return `I${fragmentName}`;
  return fragmentName;
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
 * @param options Fragment generation options (damEnabled, maxFragmentThreshold, includeBaseFragments).
 * @returns Fragment result containing fragments array and DAM flag.
 */
export const createFragment = (
  contentTypeName: string,
  visited: Set<string> = new Set(),
  suffix: string = '',
  options: FragmentOptions = {},
): FragmentResult => {
  validateContentTypeName(contentTypeName, visited);

  const {
    damEnabled = false,
    maxFragmentThreshold = 100,
    includeBaseFragments = true,
  } = options;
  const fragmentName = `${contentTypeName}${suffix}`;

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
    fields.push(...BASE_TYPE_FRAGMENTS.fields);
    extraFragments.push(...BASE_TYPE_FRAGMENTS.extraFragments);
  } else {
    contentType = getContentType(contentTypeName);
    if (!contentType) throw new GraphMissingContentTypeError(contentTypeName);

    // Process properties (contracts and content types both have properties)
    const propResult = processUserTypeProperties(
      contentType as AnyContentType,
      contentTypeName,
      suffix,
      visited,
      {
        damEnabled,
        maxFragmentThreshold,
      },
    );
    fields.push(...propResult.fields);
    extraFragments.push(...propResult.extraFragments);
    includesDamAssetsFragments = propResult.includesDamAssetsFragments;

    if (includeBaseFragments) {
      extraFragments.unshift(...BASE_TYPE_FRAGMENTS.extraFragments);
      fields.push(...BASE_TYPE_FRAGMENTS.fields);
    }

    if ('baseType' in contentType && contentType.baseType === '_experience') {
      fields.push('..._IExperience');
      const experienceResult = createExperienceFragments(visited, {
        damEnabled,
        maxFragmentThreshold,
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

const generateSingleContentQuery = (
  contentType: string,
  damEnabled: boolean = false,
  maxFragmentThreshold: number = 100,
): string => {
  const span = startSingleQuerySpan(contentType, damEnabled);
  const startTime = span ? performance.now() : 0;

  const result = createFragment(contentType, new Set(), '', {
    damEnabled,
    maxFragmentThreshold,
    includeBaseFragments: true,
  });
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
      [SemanticAttributes.OPTI_DAM_ENABLED]: damEnabled,
    });
    span.end();
  }

  return query;
};

/**
 * Generates a complete GraphQL query for fetching one item.
 *
 * @param contentType - The key of the content type to query.
 * @param damEnabled - Whether DAM assets are enabled (default: false).
 * @param maxFragmentThreshold - Maximum fragment threshold for warnings (default: 100).
 * @returns A string representing the GraphQL query.
 */
export const createSingleContentQuery = withQueryCaching(
  'single',
  generateSingleContentQuery,
);

const generateMultipleContentQuery = (
  contentType: string,
  damEnabled: boolean = false,
  maxFragmentThreshold: number = 100,
): string => {
  const span = startMultipleQuerySpan(contentType, damEnabled);
  const startTime = span ? performance.now() : 0;

  const result = createFragment(contentType, new Set(), '', {
    damEnabled,
    maxFragmentThreshold,
    includeBaseFragments: true,
  });
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
      [SemanticAttributes.OPTI_DAM_ENABLED]: damEnabled,
    });
    span.end();
  }

  return query;
};

/**
 * Generates a complete GraphQL query for fetching multiple items.
 * All items must have the same content type
 *
 * @param contentType - The key of the content type to query.
 * @param damEnabled - Whether DAM assets are enabled (default: false).
 * @param maxFragmentThreshold - Maximum fragment threshold for warnings (default: 100).
 * @returns A string representing the GraphQL query.
 */
export const createMultipleContentQuery = withQueryCaching(
  'multiple',
  generateMultipleContentQuery,
);
