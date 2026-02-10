import Footer from '@/components/base/Footer';
import Header from '@/components/base/Header';
import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import React from 'react';
import { SidebarNav } from '@/components/base/SidebarNav';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });
  const path = `/${slug.join('/')}/`;

  const content = await client.getContentByPath(path);

  if (content.length === 0) {
    notFound();
  }

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
      {/** Passing down client and currentPath to Footer to fetch dynamic links */}
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
              <OptimizelyComponent content={content[0]} />
            </main>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-10">
          <OptimizelyComponent content={content[0]} />
        </div>
      )}

      <Footer client={client} />
    </>
  );
}
