import { HeaderClient } from './Header.client';
import { getMobileNavigationItems, getNavigationItems } from '../../../lib/navigation';

export const Header = async () => {
  const [navigationItems, mobileNavItems] = await Promise.all([
    getNavigationItems(),
    getMobileNavigationItems(),
  ]);

  return (
    <HeaderClient navigationItems={navigationItems} mobileNavItems={mobileNavItems} />
  );
};
