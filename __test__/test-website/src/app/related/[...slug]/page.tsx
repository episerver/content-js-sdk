import { GraphClient } from '@optimizely/cms-sdk';
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
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const children = (await client.getItems(`/${slug.join('/')}`)) ?? [];
  const ancestors = (await client.getPath(`/${slug.join('/')}`)) ?? [];

  return (
    <div>
      <h1>Links from this page</h1>
      <h2>Children</h2>
      <ul>
        {children?.map((l) => (
          <li key={l._metadata?.key}>
            {l?._metadata?.displayName} ({l?._metadata?.url?.default})
          </li>
        ))}
      </ul>
      <h2>Ancestors (breadcrumbs)</h2>
      <ol>
        {ancestors?.map((l) => (
          <li key={l._metadata?.key}>
            {l?._metadata?.displayName} ({l?._metadata?.url?.default})
          </li>
        ))}
      </ol>
    </div>
  );
}
