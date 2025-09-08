import { GraphClient, GraphErrors } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
  // Assume that search params are correct:
  searchParams: Promise<{ variation?: string }>;
};

function handleGraphErrors(err: unknown): never {
  if (err instanceof GraphErrors.GraphResponseError) {
    console.log('Error message:', err.message);
    console.log('Query:', err.request.query);
    console.log('Variables:', err.request.variables);
  }
  if (err instanceof GraphErrors.GraphContentResponseError) {
    console.log('Detailed errors: ', err.errors);
  }

  throw err;
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { variation } = await searchParams;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const content = await client
    .fetchContent({ path: `/${slug.join('/')}/`, variation })
    .catch(handleGraphErrors);

  return <OptimizelyComponent opti={content} />;
}
