import { getFilterFromPath, GraphClient } from '@episerver/cms-sdk';
import { createQuery } from '@episerver/cms-sdk';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(
    process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_SINGLE_KEY!,
    {
      graphUrl: process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_URL,
    }
  );

  const path = '/' + slug.join('/') + '/';

  // Note: this is shown for demo purposes.
  // `fetchContentType` and `createQuery` are not needed
  const contentType = await client.fetchContentType(getFilterFromPath(path));
  const query = createQuery(contentType);
  const response = await client.fetchContent(path);

  return (
    <div>
      <h2>Input</h2>
      <div>
        Path: <code>{path}</code>
        <br />
        Content type <code>{contentType}</code>
      </div>
      <h2>Query</h2>
      <pre>{query}</pre>

      <h2>Response</h2>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </div>
  );
}
