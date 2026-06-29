import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { NavigationItem, getNavigationItems } from '../../../lib/navigation';
import { getContext } from '@optimizely/cms-sdk/react/server';

function findPath(items: NavigationItem[], targetKey: string): NavigationItem[] | null {
  for (const item of items) {
    if (item.key === targetKey) return [item];
    if (item.items) {
      const path = findPath(item.items, targetKey);
      if (path) return [item, ...path];
    }
  }
  return null;
}

export const Breadcrumbs = async () => {
  const context = getContext();
  if (!context?.key) return null;

  const navigationItems = await getNavigationItems();
  const breadcrumbs = findPath(navigationItems, context.key) ?? [];

  if (breadcrumbs.length === 0) return null;

  return (
    <nav
      aria-label='Breadcrumb'
      className='mb-8 flex items-center text-sm text-foreground2 overflow-x-auto whitespace-nowrap'
    >
      <Link href='/' className='hover:text-foreground transition-colors'>
        Home
      </Link>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.key}>
          <ChevronRight className='h-4 w-4 mx-2 shrink-0' />
          {index === breadcrumbs.length - 1 ?
            <span className='font-medium text-foreground'>{item.displayName}</span>
          : <Link href={item.url} className='hover:text-foreground transition-colors'>
              {item.displayName}
            </Link>
          }
        </React.Fragment>
      ))}
    </nav>
  );
};
