import { GraphClient, GraphErrors } from '@optimizely/cms-sdk';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
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

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = `/en/${slug.join('/')}/`;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const items = await client.getContentByPath(path).catch(handleGraphErrors);

  return (
    <>
      <h1>Query result</h1>
      <pre>{JSON.stringify(items[0], null, 2)}</pre>;
    </>
  );
}
