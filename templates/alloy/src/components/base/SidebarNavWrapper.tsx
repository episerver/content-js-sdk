import { getChildren } from '@/lib/navigation';
import { SidebarNav } from './SidebarNav';

interface SidebarNavWrapperProps {
  currentPath: string;
}

export async function SidebarNavWrapper({ currentPath }: SidebarNavWrapperProps) {
  // Check if URL contains "about-us" to show sidebar navigation
  const showSidebar = currentPath.includes('about-us');

  if (!showSidebar) {
    return null;
  }

  // Children of /en/about-us/, each with its own children already attached
  const navigationTree = await getChildren('/en/about-us');

  if (navigationTree.length === 0) {
    return null;
  }

  return <SidebarNav navigationTree={navigationTree} currentPath={currentPath} />;
}
