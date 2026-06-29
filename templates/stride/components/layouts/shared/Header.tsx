import { HeaderClient } from './Header.client';
import { getNavigationItems } from '../../../lib/navigation';

export const Header = async () => {
  const navigationItems = await getNavigationItems();

  return <HeaderClient navigationItems={navigationItems} />;
};
