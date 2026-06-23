import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_MAX_CONTRACT_EXPANSION_LIMIT,
} from '../graph/constants.js';

const queryCache = new Map<string, string>();

type QueryGenerator = (
  contentType: string,
  damEnabled?: boolean,
  maxFragmentThreshold?: number,
  maxContractExpansionLimit?: number,
) => string;

/**
 * Higher-order function that wraps query generation with caching.
 * Returns cached query if available, otherwise generates and caches it.
 */
export const withQueryCaching = (
  queryType: 'single' | 'multiple',
  generateQuery: QueryGenerator,
): QueryGenerator => {
  return (
    contentType: string,
    damEnabled: boolean = false,
    maxFragmentThreshold: number = DEFAULT_MAX_FRAGMENT_THRESHOLD,
    maxContractExpansionLimit: number = DEFAULT_MAX_CONTRACT_EXPANSION_LIMIT,
  ): string => {
    const cacheKey = `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}:${maxContractExpansionLimit}`;

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(contentType, damEnabled, maxFragmentThreshold, maxContractExpansionLimit);
    queryCache.set(cacheKey, query);
    return query;
  };
};
