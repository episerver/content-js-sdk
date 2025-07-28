import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
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
  const content = await client.fetchContent(`/${slug.join('/')}/`);

  return <OptimizelyComponent opti={content} />;
}
