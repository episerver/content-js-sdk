import { GraphClient } from 'optimizely-cms-sdk/dist/graph';

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
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    customImport: myImport,
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const c = await client.fetchContent(`/${slug}/`);

  return <pre>{JSON.stringify(c, null, 2)}</pre>;
}
