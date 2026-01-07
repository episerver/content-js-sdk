import { GraphClient, GraphErrors } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
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

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const path = `/en/${slug.join('/')}/`;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const variation = (await searchParams).variation;

  if (variation) {
    const list = await client
      .getContentByPath(path, {
        variation: { include: 'SOME', value: [variation] },
      })
      .catch(handleGraphErrors);
    return <OptimizelyComponent content={list[0]} />;
  }

  const items = await client
    .getContentByPath(path, {
      variation: { include: 'SOME', value: [], includeOriginal: true },
    })
    .catch(handleGraphErrors);

  console.log('Variations', items.length);

  const content = getRandomElement(items);

  return (
    <>
      <p>Number of variations: {items.length}</p>
      <hr />
      <OptimizelyComponent content={content} />
    </>
  );
}
