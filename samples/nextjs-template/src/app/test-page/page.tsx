import { GraphClient } from 'optimizely-cms-sdk/dist/graph';
import { createQuery } from 'optimizely-cms-sdk/dist/graph/createQuery';

async function myImport(contentType: string) {
  return import(`../../components/${contentType}.tsx`).then(
    (r) => r.ContentType
  );
}

export default async function Page() {
  const client = new GraphClient(process.env.GRAPH_SINGLE_KEY!, myImport);
  const c = await client.fetchContent('/obelisk/');

  return <pre>{JSON.stringify(c, null, 2)}</pre>;
}
