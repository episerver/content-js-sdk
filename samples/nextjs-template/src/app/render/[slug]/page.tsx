import { GraphClient } from 'optimizely-cms-sdk/graph';
import {
  initReactComponentRegistry,
  OptimizelyComponent,
} from 'optimizely-cms-sdk/react';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const client = new GraphClient(process.env.GRAPH_SINGLE_KEY!);
  const c = await client.fetchContent(`/${slug}/`);

  return <OptimizelyComponent opti={c} />;
}
