import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
  // Assume that search params are correct:
  searchParams: Promise<{ variation?: string }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const content = await client.getContentByPath(`/${slug.join('/')}/`);
  // .catch(handleGraphErrors);

  return <OptimizelyComponent content={content[0]} />;
}
