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

export const getNavigationItems = cache(async () => {
  const context = getContext();

  if (!context?.key || !context?.locale) {
    return [];
  }

  const data = await getClient().request(
    `query Navigation($key: String, $locale: String) {
      item: _Content(
        where: { _metadata: { key: { eq: $key }, locale: { eq: $locale } } }
      ) {
        item {
          ...SelectedItem
        }
      }
    }

    fragment SelectedItem on _IContent {
      item: _link(type: PATH) {
        item: _Content {
          navigationItems: items {
            ...NavigationItems
          }
        }
      }
    }

    fragment NavigationItems on _IContent {
      item: _link(type: ITEMS) {
        item: _Content(orderBy: { _metadata: { sortOrder: ASC } }) {
          navigationItems: items {
            ...NavigationItem
          }
        }
      }
    }

    fragment NavigationItem on _IContent {
      fields: _metadata {
        key
        container
        displayName
        url {
          default
        }
      }
    }`,
    {
      key: context.key,
      locale: context.locale,
    },
    undefined, // Preview token
    true, // Cache
  );

  return parseNavigationData(data, context.key);
});

function parseNavigationData(data: any, activeKey: string): NavigationItem[] {
  if (!data) {
    return [];
  }

  const groups = data.item.item.item.item.navigationItems;

  const allItems = groups.flatMap(
    (group: any) => group.item?.item?.navigationItems ?? [],
  );

  const childrenByContainer = new Map<string, any[]>();
  for (const item of allItems) {
    const container = item.fields.container;
    if (!childrenByContainer.has(container)) {
      childrenByContainer.set(container, []);
    }
    childrenByContainer.get(container)!.push(item);
  }

  function buildTree(parentKey: string): NavigationItem[] | null {
    const children = childrenByContainer.get(parentKey);
    if (!children?.length) return null;

    return children.map((child: any) => {
      const key = child.fields.key;
      const items = buildTree(key);
      const isActive = key === activeKey;
      return {
        key,
        displayName: child.fields.displayName,
        url: child.fields.url.default,
        isActive,
        items,
      };
    });
  }

  const rootContainer = allItems[0]?.fields.container;
  return buildTree(rootContainer) ?? [];
}
