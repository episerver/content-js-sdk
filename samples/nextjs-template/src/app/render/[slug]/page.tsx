import { GraphClient } from 'optimizely-cms-sdk/dist/graph';
import {
  initReactComponentRegistry,
  OptimizelyComponent,
} from 'optimizely-cms-sdk/dist/render/react';
import React from 'react';

initReactComponentRegistry({
  resolver(contentType) {
    return React.lazy(() => import(`../../../components/${contentType}.tsx`));
  },
});

async function myImport(contentType: string) {
  return import(`../../../components/${contentType}.tsx`).then(
    (r) => r.ContentType
  );
}

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const client = new GraphClient(process.env.GRAPH_SINGLE_KEY!, myImport);
  const c = await client.fetchContent(`/${slug}/`);

  return <OptimizelyComponent opti={c} />;
}
