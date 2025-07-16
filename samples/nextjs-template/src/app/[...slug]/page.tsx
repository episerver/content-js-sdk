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

  const client = new GraphClient(
    process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_SINGLE_KEY!,
    {
      graphUrl: process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_URL,
    }
  );
  const c = await client.fetchContent(`/${slug.join('/')}/`);

  return <OptimizelyComponent opti={c} />;
}
