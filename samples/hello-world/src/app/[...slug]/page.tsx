import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = getClient();
  const content = await client.getContentByPath(`/${slug.join('/')}/`);

  if (content.length === 0) {
    notFound();
  }

  return <OptimizelyComponent content={content[0]} />;
}
