// This file handles the endpoint "webhook", which handles incoming
// webhook requests from Optimizely Graph
//
// For this example, when a content in a given path is modified and published,
// the same path in this project is revalidated.
import { GraphClient } from '@optimizely/cms-sdk';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

// Security. The hook URL must be unique. Anyone with the URL would be able to
// revoke a cache, so treat it with the same security as you would with any token
// or password
//
// Ensure that `WEBHOOK_ID` is a valid URL. Be careful with non-ASCII characters
const WEBHOOK_ID = process.env.WEBHOOK_ID!;

// With this GraphQL query, you can fetch the path of a document given its ID
const GET_PATH_QUERY = `
query GetPath($id:String) {
  _Content(ids: [$id]) {
    item {
      _id 
      _metadata { url { default } }
    }
  }
}`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const webhookId = (await params).id;

  // Always check the incoming "id" in the path.
  if (webhookId !== WEBHOOK_ID) {
    notFound();
  }

  const body = await request.json();
  const docId = body.data.docId;

  if (typeof docId !== 'string') {
    console.error('docId is not a string');
    return Response.json({ message: 'docId is not a string' });
  }

  // The field `docId` has the format <UUID>_<language>_status,
  // but to search in Graph, we need only the UUID without separation dashes `-`
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
