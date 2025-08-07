import {
  getFilterFromPath,
  GraphClient,
  GraphErrors,
} from '@episerver/cms-sdk';
import { createQuery } from '@episerver/cms-sdk';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

function handleGraphErrors(err: unknown): never {
  if (err instanceof GraphErrors.GraphResponseError) {
    console.log('---- ERROR -----');
    console.log(err.message);
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
  const contentType = await client
    .fetchContentType(getFilterFromPath(path))
    .catch(handleGraphErrors);
  const query = createQuery(contentType);
  const response = await client.fetchContent(path).catch(handleGraphErrors);

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
