import { HeaderClient } from './HeaderClient';
import { getNavigationItems } from '../../lib/navigation';

export const Header = async () => {
  const navigationItems = await getNavigationItems();

  return <HeaderClient navigationItems={navigationItems} />;
};
