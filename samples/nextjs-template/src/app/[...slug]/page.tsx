import { GraphClient } from 'optimizely-cms-sdk/dist/graph';
import {
  initReactComponentRegistry,
  OptimizelyComponent,
} from 'optimizely-cms-sdk/dist/render/react';
import React from 'react';

async function myImport(contentType: string) {
  return import(`../../components/${contentType}.tsx`).then(
    (r) => r.ContentType
  );
}

initReactComponentRegistry({
  resolver(contentType) {
    return React.lazy(() => import(`../../components/${contentType}.tsx`));
  },
});

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    customImport: myImport,
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const c = await client.fetchContent(`/${slug.join('/')}/`);

  return <OptimizelyComponent opti={c} />;
}
