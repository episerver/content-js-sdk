import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
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

  const children = [
    ...((await client.getLinksByPath(`/${slug.join('/')}/`)) ?? []),
    // NOTE: if you are using "simple address", you should fetch without trailing slash:
    ...((await client.getLinksByPath(`/${slug.join('/')}`)) ?? []),
  ];
  const ancestors = [
    ...((await client.getLinksByPath(`/${slug.join('/')}/`, {
      type: 'PATH',
    })) ?? []),
    // Same here:
    ...((await client.getLinksByPath(`/${slug.join('/')}`, {
      type: 'PATH',
    })) ?? []),
  ];
  // .catch(handleGraphErrors);

  return (
    <div>
      <h1>Links from this page</h1>
      <h2>Children</h2>
      <ul>
        {children?.map((l) => (
          <li>
            {l?.displayName} ({l?.url?.default})
          </li>
        ))}
      </ul>
      <h2>Ancestors (breadcrumbs)</h2>
      <ol>
        {ancestors?.map((l) => (
          <li>
            {l?.displayName} ({l?.url?.default})
          </li>
        ))}
      </ol>
    </div>
  );
}
