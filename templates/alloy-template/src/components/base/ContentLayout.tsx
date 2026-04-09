import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { SidebarNavWrapper } from './SidebarNavWrapper';

interface ContentLayoutProps {
  content: any;
  currentPath: string;
}

export async function ContentLayout({
  content,
  currentPath,
}: ContentLayoutProps) {
  const showSidebar = currentPath.includes('about-us');

  if (showSidebar) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-8">
          {/* Sidebar Navigation - Hidden on mobile, visible on md and up */}
          <aside className="hidden md:block w-64 shrink-0">
            <SidebarNavWrapper currentPath={currentPath} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <OptimizelyComponent content={content} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-10">
      <OptimizelyComponent content={content} />
    </div>
  );
}
