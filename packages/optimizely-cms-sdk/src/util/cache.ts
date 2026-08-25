import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
} from '../graph/constants.js';
import type { FilterShape, VariationMode } from '../graph/filters.js';

const queryCache = new Map<string, string>();

type QueryGenerator = (
  contentType: string,
  damEnabled?: boolean,
  maxFragmentThreshold?: number,
  expandContracts?: boolean,
  filterShape?: FilterShape,
  variationMode?: VariationMode,
) => string;

const getVariationModeKey = (mode?: VariationMode): string => {
  if (!mode || mode === 'none') return 'none';
  if (mode === 'all') return 'all';
  return `some-${mode.count}`;
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
    filterShape?: FilterShape,
    variationMode?: VariationMode,
  ): string => {
    const shapePart = filterShape ? `:${filterShape}` : '';
    const variationPart = `:${getVariationModeKey(variationMode)}`;
    const cacheKey =
      `${queryType}:${contentType}:${damEnabled}:${maxFragmentThreshold}:${expandContracts}` +
      shapePart +
      variationPart;

    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = generateQuery(
      contentType,
      damEnabled,
      maxFragmentThreshold,
      expandContracts,
      filterShape,
      variationMode,
    );
    queryCache.set(cacheKey, query);
    return query;
  };
};
