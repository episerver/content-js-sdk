import {
  createQueryContext,
  type FragmentOptions,
  type QueryContext,
} from './queryUtils.js';
import { getAllContentTypes } from '../model/contentTypeRegistry.js';
import type { FilterShape, VariationMode } from '../graph/filters.js';

const queryCache = new Map<string, string>();

/** The lenient option bag the query builders accept. */
type QueryOptions = Partial<QueryContext> & FragmentOptions & {
  filterShape?: FilterShape;
  variationMode?: VariationMode;
};

type QueryGenerator = (contentType: string, options?: QueryOptions) => string;

const getFilterHash = (typeFilter: (key: string) => boolean): string => {
  return getAllContentTypes()
    .filter(ct => typeFilter('key' in ct ? ct.key : ''))
    .map(ct => ('key' in ct ? ct.key : ''))
    .sort()
    .join(',');
};

const getVariationModeKey = (mode?: VariationMode): string => {
  if (!mode || mode === 'none') return 'none';
  if (mode === 'all') return 'all';
  return `some-${mode.count}`;
};

/**
 * Builds the cache key from every setting that can change the generated query.
 *
 * Defaults come from `createQueryContext`, the same helper the generator uses,
 * so a key and the query it points at cannot disagree about what a missing
 * option means.
 */
function createCacheKey(
  queryType: 'single' | 'multiple',
  contentType: string,
  options: QueryOptions = {},
): string {
  const {
    damEnabled,
    maxFragmentThreshold,
    expandContracts,
    formsEnabled,
    typeFilter,
    sectionTypes,
  } = createQueryContext(options);
  const { includeBaseFragments = true, filterShape, variationMode } = options;

  const filterPart = typeFilter ? `:${getFilterHash(typeFilter)}` : '';
  // Which types own a `composition` changes the query, and differs per endpoint.
  const sectionPart = sectionTypes ? `:${[...sectionTypes].sort().join(',')}` : '';
  const shapePart = filterShape ? `:${filterShape}` : '';
  const variationPart = `:${getVariationModeKey(variationMode)}`;

  return (
    [
      queryType,
      contentType,
      damEnabled,
      maxFragmentThreshold,
      expandContracts,
      formsEnabled,
      includeBaseFragments,
    ].join(':') +
    filterPart +
    sectionPart +
    shapePart +
    variationPart
  );
}

/**
 * Higher-order function that wraps query generation with caching.
 * Returns cached query if available, otherwise generates and caches it.
 */
export const withQueryCaching = (
  queryType: 'single' | 'multiple',
  generateQuery: QueryGenerator,
): QueryGenerator => {
  return (contentType: string, options?: QueryOptions): string => {
    const cacheKey = createCacheKey(queryType, contentType, options);
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const query = generateQuery(contentType, options);
    queryCache.set(cacheKey, query);
    return query;
  };
};
