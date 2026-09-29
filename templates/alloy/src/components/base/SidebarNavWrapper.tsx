import { getClient } from '@optimizely/cms-sdk';
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

  const client = getClient();
  // Locale is the first URL segment, e.g. "/de/about-us" -> "de"
  const locale = currentPath.split('/')[1] || 'en';
  // Always fetch children of about-us for the sidebar
  const siblings =
    (await client.getItems(`/${locale}/about-us`, { locales: [locale] })) ?? [];

  // Fetch children for each sibling to build the navigation tree
  const navigationTree = await Promise.all(
    siblings.map(async (sibling: any) => {
      const siblingPath = sibling._metadata?.url?.hierarchical;
      const children =
        siblingPath ? ((await client.getItems(siblingPath, { locales: [locale] })) ?? []) : [];
      return {
        ...sibling,
        children,
      };
    }),
  );

  if (navigationTree.length === 0) {
    return null;
  }

  return <SidebarNav navigationTree={navigationTree} currentPath={currentPath} />;
}
