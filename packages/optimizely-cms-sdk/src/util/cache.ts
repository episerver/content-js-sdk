const queryCache = new Map<string, string>();

type QueryGenerator = (contentType: string, damEnabled?: boolean, maxFragmentThreshold?: number) => string;

/**
 * Higher-order function that wraps query generation with caching.
 * Returns cached query if available, otherwise generates and caches it.
 */
export const withQueryCaching = (queryType: 'single' | 'multiple', generateQuery: QueryGenerator): QueryGenerator => {
  return (contentType: string, damEnabled: boolean = false, maxFragmentThreshold: number = 100): string => {
    const cacheKey = `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}`;

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(contentType, damEnabled, maxFragmentThreshold);
    queryCache.set(cacheKey, query);
    return query;
  };
};
