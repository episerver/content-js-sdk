import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
} from '../graph/constants.js';

const queryCache = new Map<string, string>();

type TypeFilter = ((contentTypeKey: string) => boolean) | undefined;

type QueryGenerator = (
  contentType: string,
  damEnabled?: boolean,
  maxFragmentThreshold?: number,
  expandContracts?: boolean,
  typeFilter?: TypeFilter,
) => string;

/**
 * Higher-order function that wraps query generation with caching.
 * Returns cached query if available, otherwise generates and caches it.
 * When a typeFilter is provided, caching is bypassed since the filter is a function.
 */
export const withQueryCaching = (
  queryType: 'single' | 'multiple',
  generateQuery: QueryGenerator,
): QueryGenerator => {
  return (
    contentType: string,
    damEnabled: boolean = false,
    maxFragmentThreshold: number = DEFAULT_MAX_FRAGMENT_THRESHOLD,
    expandContracts: boolean = DEFAULT_EXPAND_CONTRACTS,
    typeFilter?: TypeFilter,
  ): string => {
    if (typeFilter) {
      return generateQuery(contentType, damEnabled, maxFragmentThreshold, expandContracts, typeFilter);
    }

    const cacheKey = `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}:${expandContracts}`;

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(contentType, damEnabled, maxFragmentThreshold, expandContracts);
    queryCache.set(cacheKey, query);
    return query;
  };
};
