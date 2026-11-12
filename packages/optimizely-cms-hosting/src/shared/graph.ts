import { GraphClient } from '@optimizely/cms-sdk';
import { envGraphGateway } from './env.js';

type PathResponse = {
  _Content?: { item?: { _metadata?: { url?: { default?: string | null } } } };
};

const PATH_QUERY = `
query ResolveDocPath($id: String, $locale: Locales) {
  _Content(ids: [$id], locale: [$locale]) {
    item { _metadata { url { default } } }
  }
}`;

// `{uuid}_{locale}_{status}`, where Graph locale names can contain underscores themselves
const parseDocId = (docId: string) => {
  const [uuid, ...rest] = docId.split('_');
  const locale = rest.slice(0, -1).join('_').replaceAll('-', '_');

  return { id: uuid.replaceAll('-', ''), locale };
};

// url.default is absolute when the content's application has a host
const toPath = (url: string) => {
  const pathname = URL.canParse(url) ? new URL(url).pathname : url;
  return pathname.replace(/\/+$/, '') || '/';
};

/**
 * Resolves the `docId` of a Graph webhook to the URL path of that content, or
 * `undefined` when Graph has no URL for it.
 */
export async function resolveDocPath(docId: string): Promise<string | undefined> {
  const singleKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
  if (!singleKey) throw new Error('OPTIMIZELY_GRAPH_SINGLE_KEY is not set');

  const client = new GraphClient(singleKey, { graphUrl: envGraphGateway() });
  // Uncached, so content that was just moved resolves to its new URL
  const data: PathResponse = await client.request(
    PATH_QUERY,
    parseDocId(docId),
    undefined,
    false,
  );
  const url = data?._Content?.item?._metadata?.url?.default;

  return url ? toPath(url) : undefined;
}
