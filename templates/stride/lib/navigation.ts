import { getClient } from '@optimizely/cms-sdk';
import { getContext } from '@optimizely/cms-sdk/react/server';
import { cache } from 'react';

export type NavigationItem = {
  key: string;
  displayName: string;
  url: string;
  isActive: boolean;
  items: NavigationItem[] | null;
};

type RawNavigationItem = {
  _metadata?: {
    key: string;
    displayName?: string;
    locale?: string;
    types: string[];
    url?: {
      default?: string;
    };
  };
};

const fetchChildItems = async (
  parentKey: string,
  locale: string,
  activeKey: string,
): Promise<NavigationItem[]> => {
  const items = await getClient().getItems({ key: parentKey, locale });

  if (!items?.length) return [];

  const filteredItems = items.filter(
    (item: RawNavigationItem) =>
      item._metadata && !item._metadata.types.includes('BlankExperience'),
  );

  return Promise.all(
    filteredItems.map(async (item: RawNavigationItem) => {
      const metadata = item._metadata!;
      const grandchildItems = await fetchChildItems(metadata.key, locale, activeKey);

      return {
        key: metadata.key,
        displayName: metadata.displayName || '',
        url: metadata.url?.default || '',
        isActive: metadata.key === activeKey,
        items: grandchildItems.length > 0 ? grandchildItems : null,
      };
    }),
  );
};

/**
 * Prepends an "Overview" entry linking to the parent itself, for every node that
 * has children. A pure reshape of an already-fetched tree - keeping it out of the
 * fetch is what lets desktop and mobile share one set of requests.
 */
const withOverviewEntries = (items: NavigationItem[]): NavigationItem[] =>
  items.map(item =>
    item.items?.length ?
      {
        ...item,
        items: [
          {
            key: item.key,
            displayName: 'Overview',
            url: item.url,
            isActive: item.isActive,
            items: null,
          },
          ...withOverviewEntries(item.items),
        ],
      }
    : item,
  );

/**
 * The navigation tree, fetched once per request. Takes no arguments so that every
 * caller - desktop nav, mobile nav, breadcrumbs, footer, search - shares a single
 * React `cache()` entry and therefore a single walk of the tree.
 */
const getNavigationTree = cache(async (): Promise<NavigationItem[]> => {
  const context = getContext();

  if (!context?.key || !context?.locale) {
    return [];
  }

  const path = await getClient().getPath({ key: context.key, locale: context.locale });
  if (!path?.length) return [];

  const rootKey = path[0]._metadata?.key;
  const rootUrl = path[0]._metadata?.url?.default || '';
  if (!rootKey || !rootUrl) return [];

  return fetchChildItems(rootKey, context.locale, context.key);
});

export const getNavigationItems = async (skipOverview: boolean = true) => {
  const tree = await getNavigationTree();
  return skipOverview ? tree : withOverviewEntries(tree);
};

export const getMobileNavigationItems = () => getNavigationItems(false);
