import {
  createFragment,
  GraphClient,
  itemContentQuery,
  itemMetadataQuery,
  filters,
  GraphErrors,
} from '@episerver/cms-sdk';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

function handleGraphErrors(err: unknown): never {
  if (err instanceof GraphErrors.GraphResponseError) {
    console.log('---- ERROR -----');
    console.log('Message', err.message);
    console.log('---- QUERY -----');
    console.log(err.request.query);
    console.log('----- VARIABLES -----');
    console.log(JSON.stringify(err.request.variables, null, 2));
  }
  if (err instanceof GraphErrors.GraphContentResponseError) {
    console.log('---- ERRRORS ----');
    console.log(err.errors);
  }

  throw err;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const path = '/' + slug.join('/') + '/';

  // Note: this is shown for demo purposes.
  // `fetchContentType` and `createQuery` are not needed
  const query1 = itemMetadataQuery();
  const contentType = await client
    .getItemContentType(filters.pathFilter(path))
    .catch(handleGraphErrors);
  const query2 = itemContentQuery(contentType, createFragment(contentType));
  const response = await client.fetchContent(path).catch(handleGraphErrors);

  return (
    <div>
      <h2>Input</h2>
      <div>
        Path: <code>{path}</code>
        <br />
      </div>
      <h2>Metadata query</h2>
      <pre>{query1}</pre>
      Content type <code>{contentType}</code>
      <h2>Content query</h2>
      <pre>{query2}</pre>
      <h3>Response</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </div>
  );
}
