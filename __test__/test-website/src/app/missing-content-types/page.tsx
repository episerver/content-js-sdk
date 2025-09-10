import {
  ct4,
  ct5,
  notSynced,
} from '@/components/missing-content-types/not-synced';
import { GraphClient, initContentTypeRegistry } from '@episerver/cms-sdk';
import React from 'react';

initContentTypeRegistry([ct4, ct5, notSynced]);

type Props = {
  // Assuming is well defined
  searchParams: Promise<{ [key: string]: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { path } = await searchParams;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const c = await client.fetchContent(path);

  return <pre>{c}</pre>;
}
