import { GraphClient } from 'optimizely-cms-sdk/dist/graph';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';
import React from 'react';

export async function generateStaticParams() {
  // TODO: Get this from the CMS instead of hard-coding
  return [{ slug: ['en', 'obelisk'] }];
}

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
  const c = await client.fetchContent(`/${slug.join('/')}/`);

  return <OptimizelyComponent opti={c} />;
}
