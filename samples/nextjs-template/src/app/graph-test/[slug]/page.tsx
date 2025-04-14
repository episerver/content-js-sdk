import { GraphClient } from 'optimizely-cms-sdk/dist/graph';

async function myImport(contentType: string) {
  return import(`../../components/${contentType}.tsx`).then(
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

  return <pre>{JSON.stringify(c, null, 2)}</pre>;
}
