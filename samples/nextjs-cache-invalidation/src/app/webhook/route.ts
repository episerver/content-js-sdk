import { GraphClient } from '@optimizely/cms-sdk';
import { revalidatePath } from 'next/cache';

// This GraphQL query fetches
const GET_PATH_QUERY = `
query GetPath($id:String) {
  _Content(ids: [$id]) {
    item {
      _id 
      _metadata { url { default } }
    }
  }
}`;

// Handles requests to the endpoint /webhook
export async function POST(request: Request) {
  const body = await request.json();
  const docId = body.data.docId;

  if (typeof docId !== 'string') {
    console.error('docId is not a string');
    return Response.json({ message: 'docId is not a string' });
  }

  // Transform "aaa-bbb-ccc_lang_state" to "aaabbbccc"
  const id = docId.split('_')[0].replaceAll('-', '');
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });

  const response = await client.request(GET_PATH_QUERY, { id });
  const path = response._Content.item._metadata.url.default.slice(0, -1);

  revalidatePath(path);
  console.log('Path "%s" successfully revalidated', path);

  return Response.json({ message: 'OK' });
}
