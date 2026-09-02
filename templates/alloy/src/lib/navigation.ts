import { getClient } from '@optimizely/cms-sdk';
import { cache } from 'react';

export interface NavItem {
  _metadata: {
    key: string;
    displayName: string;
    url: {
      hierarchical: string;
    };
  };
  children: NavItem[];
}

/** URL of the start page. Everything in the menus hangs off it. */
const ROOT = '/en/';

const normalize = (path: string) => (path.endsWith('/') ? path : `${path}/`);

/**
 * The site tree, fetched once per request and shared by every menu.
 *
 * `getDescendants` returns the whole subtree in one go, so the header, footer
 * and sidebar cost nothing beyond the first one to ask. Calling `getItems` per
 * menu instead repeated the same requests, and building the sidebar's two
 * levels with it cost one request per section.
 */
const getSiteTree = cache(async () => {
  const pages = (await getClient().getDescendants(ROOT)) ?? [];

  const nodes = new Map<string, NavItem>();
  const parentOf = new Map<string, string>();

  for (const { _metadata: metadata } of pages) {
    if (!metadata?.url?.hierarchical) continue;

    nodes.set(metadata.key, {
      _metadata: {
        key: metadata.key,
        displayName: metadata.displayName ?? '',
        url: { hierarchical: metadata.url.hierarchical },
      },
      children: [],
    });
    parentOf.set(metadata.key, metadata.container ?? '');
  }

  const topLevel: NavItem[] = [];
  const byPath = new Map<string, NavItem>();

  for (const [key, node] of nodes) {
    const parent = nodes.get(parentOf.get(key)!);

    if (parent) parent.children.push(node);
    else topLevel.push(node);

    byPath.set(normalize(node._metadata.url.hierarchical), node);
  }

  return { topLevel, byPath };
});

/**
 * The direct children of a page, with their own children already attached.
 *
 * @param path - URL of the parent page, e.g. `/en/about-us`
 */
export async function getChildren(path: string): Promise<NavItem[]> {
  const { topLevel, byPath } = await getSiteTree();

  if (normalize(path) === ROOT) return topLevel;

  return byPath.get(normalize(path))?.children ?? [];
}
