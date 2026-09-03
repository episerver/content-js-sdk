import { getClient } from '@optimizely/cms-sdk';
import {
  OptimizelyComponent,
  setContext,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

type Props = {
  params: Promise<{ slug?: string[] }>;
};

const defaultSlug = ['en'];

/** `['en', 'about-us']` → `/en/about-us`. Also the cache key below. */
const toPath = (slug?: string[]) => `/${(slug ?? defaultSlug).join('/')}`;

// Use the path as the cache key to avoid duplicate fetches.
const getContentByPath = cache(async (path: string) => {
  const result = await getClient().getContentByPath(path);

  if (result.length === 0) {
    return null;
  }

  return result[0];
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentByPath(toPath(slug));

  if (content === null) {
    return {
      title: 'Stride — Page Not Found',
    };
  }

  // TODO: Add SEO fields and render as metadata
  return {
    title: `Stride — ${content._metadata.displayName}`,
    description: '',
  };
}

export async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getContentByPath(toPath(slug));

  if (content === null) {
    notFound();
  }

  setContext({
    currentContent: content,
    key: content._metadata.key,
    type: content._metadata.types[0],
    locale: content._metadata.fallbackForLocale ?? content._metadata.locale,
  });

  return <OptimizelyComponent content={content} />;
}

export default withAppContext(Page);
