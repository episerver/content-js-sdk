import Link from 'next/link';
import { cn } from '../../lib/utils';
import { getNavigationItems, NavigationItem } from '../../lib/navigation';

export const SubNavigation = async () => {
  const navigationItems = await getNavigationItems();

  const renderItems = (items: NavigationItem[], nested = false) => (
    <ul className='border-white/10 flex flex-col gap-1'>
      {items.map(item => (
        <li key={item.key} className={cn({ 'pl-3': nested })}>
          <Link
            href={item.url}
            className='group relative text-foreground/90 hover:text-foreground block font-semibold transition-colors py-2'
          >
            {item.displayName}
            <span
              className={cn(
                '-z-1 absolute border border-foreground/5 opacity-0 group-hover:opacity-100 duration-100 -inset-4 top-0 bottom-0 rounded bg-foreground/4 backdrop-blur-[3px]',
                {
                  'opacity-100 border-l-4 border-l-key1': item.isActive,
                },
              )}
            />
          </Link>
          {item.items && renderItems(item.items, true)}
        </li>
      ))}
    </ul>
  );

  return (
    <nav className='sticky top-32 flex flex-col gap-1'>
      {renderItems(navigationItems.flatMap(item => item.items ?? []))}
    </nav>
  );
};
