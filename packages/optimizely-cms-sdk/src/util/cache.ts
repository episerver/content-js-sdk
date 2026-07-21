import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
} from '../graph/constants.js';

const queryCache = new Map<string, string>();

type QueryGenerator = (
  contentType: string,
  damEnabled?: boolean,
  maxFragmentThreshold?: number,
  expandContracts?: boolean,
  formsEnabled?: boolean,
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
    expandContracts: boolean = DEFAULT_EXPAND_CONTRACTS,
    formsEnabled: boolean = false,
  ): string => {
    const cacheKey = `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}:${expandContracts}:${formsEnabled}`;

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(contentType, damEnabled, maxFragmentThreshold, expandContracts, formsEnabled);
    queryCache.set(cacheKey, query);
    return query;
  };
};
