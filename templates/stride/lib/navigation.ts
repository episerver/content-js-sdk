import { getClient, type GraphClient } from '@optimizely/cms-sdk';
import { getContext } from '@optimizely/cms-sdk/react/server';
import { cache } from 'react';

export type NavigationItem = {
  key: string;
  displayName: string;
  url: string;
  isActive: boolean;
  items: NavigationItem[] | null;
};

/** `getDescendants` returns a flat list, already sorted; this nests it. */
function buildTree(
  pages: Awaited<ReturnType<GraphClient['getDescendants']>>,
  rootKey: string,
  activeKey: string,
): NavigationItem[] {
  const nodes = new Map<string, NavigationItem>();
  const parentOf = new Map<string, string>();

  for (const { _metadata: metadata } of pages ?? []) {
    if (!metadata) continue;
    if (metadata.types.includes('BlankExperience')) continue;

    nodes.set(metadata.key, {
      key: metadata.key,
      displayName: metadata.displayName || '',
      url: metadata.url?.default || '',
      isActive: metadata.key === activeKey,
      items: null,
    });
    parentOf.set(metadata.key, metadata.container || '');
  }

  const roots: NavigationItem[] = [];

  for (const [key, node] of nodes) {
    const parentKey = parentOf.get(key)!;
    const parent = nodes.get(parentKey);

    if (parent) (parent.items ??= []).push(node);
    // A page whose parent was filtered out is dropped with it.
    else if (parentKey === rootKey) roots.push(node);
  }

  return roots;
}

/** Prepends an "Overview" link to every branch, pointing at the branch itself. */
const withOverview = (items: NavigationItem[], activeKey?: string): NavigationItem[] =>
  items.map(item =>
    item.items?.length ?
      {
        ...item,
        items: [
          {
            key: item.key,
            displayName: 'Overview',
            url: item.url,
            isActive: item.key === activeKey,
            items: null,
          },
          ...withOverview(item.items, activeKey),
        ],
      }
    : item,
  );

export const getNavigationItems = cache(async (): Promise<NavigationItem[]> => {
  const context = getContext();

  if (!context?.key || !context?.locale) {
    return [];
  }

  // The page already carries its ancestors. Preview renders without them, so
  // fall back to asking for the path there.
  const currentContent = context.currentContent as
    | { _metadata?: { path?: string[] } }
    | undefined;
  const rootKey =
    currentContent?._metadata?.path?.[0] ??
    (await getClient().getPath({ key: context.key, locale: context.locale }))?.[0]
      ?._metadata?.key;

  if (!rootKey) return [];

  const pages = await getClient().getDescendants({
    key: rootKey,
    locale: context.locale,
  });

  return buildTree(pages, rootKey, context.key);
});

export const getMobileNavigationItems = cache(async () =>
  withOverview(await getNavigationItems(), getContext()?.key),
);
