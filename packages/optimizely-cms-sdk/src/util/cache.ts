import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
} from '../graph/constants.js';
import { DEFAUL_FRAGMENT_OPTIONS } from '../graph/createQuery.js';
import type { FragmentOptions } from './queryUtils.js';

const queryCache = new Map<string, string>();

type QueryGenerator = (
  contentType: string,
  options?: FragmentOptions,
) => string;

function createCacheKey(
  queryType: 'single' | 'multiple',
  contentType: string,
  options: FragmentOptions = DEFAUL_FRAGMENT_OPTIONS,
): string {
  const {
    damEnabled = false,
    maxFragmentThreshold = DEFAULT_MAX_FRAGMENT_THRESHOLD,
    expandContracts = DEFAULT_EXPAND_CONTRACTS,
    formsEnabled = false,
  } = options;

  return `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}:${expandContracts}:${formsEnabled}`;
}

/**
 * Higher-order function that wraps query generation with caching.
 * Returns cached query if available, otherwise generates and caches it.
 */
export const withQueryCaching = (
  queryType: 'single' | 'multiple',
  generateQuery: QueryGenerator,
): QueryGenerator => {
  return (contentType: string, options?: FragmentOptions): string => {
    const cacheKey = createCacheKey(queryType, contentType, options);

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(contentType, options);
    queryCache.set(cacheKey, query);
    return query;
  };
};
