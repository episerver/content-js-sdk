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

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getRandomVariation(client: GraphClient, path: string) {
  const list = await client.listContentMetadata(path);
  const variations = list.map((item) => item._metadata.variation);
  console.log('Variations are: ', variations);

  return getRandomElement(variations);
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const path = `/${slug.join('/')}/`;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const variation =
    (await searchParams).variation ?? (await getRandomVariation(client, path));

  const content = await client
    .getContent({ path, variation })
    .catch(handleGraphErrors);

  return <OptimizelyComponent opti={content} />;
}
