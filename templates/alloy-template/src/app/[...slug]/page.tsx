import Footer from '@/components/base/Footer';
import Header from '@/components/base/Header';
import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const path = `/${slug.join('/')}/`;
  const pageContent = await client.getContentByPath(path);

  if (pageContent.length === 0) {
    notFound();
  }

  return (
    <>
      {/** Passing down client and currentPath to Footer to fetch dynamic links */}
      <Header client={client} currentPath={path} />
      <div className="container mx-auto p-10">
        <OptimizelyComponent opti={pageContent[0]} />
      </div>
      <Footer client={client} />
    </>
  );
}
