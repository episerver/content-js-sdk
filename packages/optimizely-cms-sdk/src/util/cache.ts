import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
} from '../graph/constants.js';
import { getAllContentTypes } from '../model/contentTypeRegistry.js';

const queryCache = new Map<string, string>();

type TypeFilter = ((contentTypeKey: string) => boolean) | undefined;

type QueryGenerator = (
  contentType: string,
  damEnabled?: boolean,
  maxFragmentThreshold?: number,
  expandContracts?: boolean,
  typeFilter?: TypeFilter,
) => string;

const getFilterHash = (typeFilter: (key: string) => boolean): string => {
  return getAllContentTypes()
    .filter(ct => typeFilter('key' in ct ? ct.key : ''))
    .map(ct => ('key' in ct ? ct.key : ''))
    .sort()
    .join(',');
};

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
    typeFilter?: TypeFilter,
  ): string => {
    const filterPart = typeFilter ? `:${getFilterHash(typeFilter)}` : '';
    const cacheKey = `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}:${expandContracts}${filterPart}`;

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(contentType, damEnabled, maxFragmentThreshold, expandContracts, typeFilter);
    queryCache.set(cacheKey, query);
    return query;
  };
};
