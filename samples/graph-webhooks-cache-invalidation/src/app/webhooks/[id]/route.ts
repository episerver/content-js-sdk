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

/** Given a `docId`, revalidate the path of that item */
async function revalidateDocId(docId: string) {
  // The field `docId` has the format <UUID>_<language>_status,
  // but to search in Graph, we need only the UUID without separation dashes `-`
  const parts = docId.split('_');
  const id = parts[0].replaceAll('-', '');
  const locale = parts[1]; // e.g., "en"
    
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const getPathQuery = `
query GetPath($id:String, $locale: Locales) {
  _Content(ids: [$id], locale: [$locale]) {
    item {
      _id 
      _metadata { url { default } }
    }
  }
}`;

  const response = await client.request(getPathQuery, { id, locale });
  const raw = response._Content.item._metadata.url.default;
  const path = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  revalidatePath(path);
  console.log('Path "%s" successfully revalidated', path);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const webhookId = (await params).id;

  if (webhookId !== WEBHOOK_ID) {
    notFound();
  }

  const body = await request.json();

  // Learn more about the format of webhook responses:
  // https://docs.developers.optimizely.com/platform-optimizely/docs/webhook-response
  if (body.type.subject === 'bulk' && body.type.action === 'completed') {
    const deleted = Object.values(body.data.items ?? {}).find(
      (status) => status === 'deleted'
    );

    // At this moment, there is no way to retrieve which page has been deleted
    // so for this example, we are going to revalidate all data
    if (deleted) {
      revalidatePath('/', 'layout');
    }
  } else if (body.type.subject === 'doc' && body.type.action === 'updated') {
    await revalidateDocId(body.data.docId);
  }

  return Response.json({ message: 'OK' });
}
