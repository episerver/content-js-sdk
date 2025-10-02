import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
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
  const c = await client.getContentByPath(`/${slug.join('/')}/`);

  if (c.length === 0) {
    notFound();
  }

  return <OptimizelyComponent opti={c[0]} />;
}
