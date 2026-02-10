import { GraphClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import Script from 'next/script';
import Header from '@/components/base/Header';
import Footer from '@/components/base/Footer';
import { SidebarNav } from '@/components/base/SidebarNav';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const content = await client
    .getPreviewContent(
      // TODO: check types in runtime properly
      (await searchParams) as PreviewParams,
    )
    .catch((err) => {
      console.log(err.errors);
      console.log(err.request?.query);
      throw err;
    });

  // Get the path from the response metadata
  const path = content._metadata?.url?.hierarchical || '/';

  // Check if URL contains "about-us" to show sidebar navigation
  const showSidebar = path.includes('about-us');

  // Fetch siblings for sidebar navigation when in "about-us" section
  let navigationTree: any[] = [];
  if (showSidebar) {
    // Always fetch children of /en/about-us/ for the sidebar
    const siblings = (await client.getItems('/en/about-us')) ?? [];

    // Fetch children for each sibling to build the navigation tree
    navigationTree = await Promise.all(
      siblings.map(async (sibling: any) => {
        const siblingPath = sibling._metadata?.url?.hierarchical;
        const children = siblingPath
          ? ((await client.getItems(siblingPath)) ?? [])
          : [];
        return {
          ...sibling,
          children,
        };
      }),
    );
  }

  return (
    <>
      <Script
        src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
      ></Script>
      <PreviewComponent />
      <Header client={client} currentPath={path} />

      {showSidebar && navigationTree.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-8">
            {/* Sidebar Navigation - Hidden on mobile, visible on md and up */}
            <aside className="hidden md:block w-64 shrink-0">
              <SidebarNav navigationTree={navigationTree} currentPath={path} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <OptimizelyComponent content={content} />
            </main>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-10">
          <OptimizelyComponent content={content} />
        </div>
      )}

      <Footer client={client} />
    </>
  );
}
