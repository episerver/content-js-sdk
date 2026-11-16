import { GraphClient } from '@optimizely/cms-sdk';
import { envGraphGateway } from './env.js';

type Urls = { default?: string | null; hierarchical?: string | null };
type PathResponse = { _Content?: { item?: { _metadata?: { url?: Urls } } } };

const PATH_QUERY = `
query ResolveDocPaths($id: String, $locale: Locales) {
  _Content(ids: [$id], locale: [$locale]) {
    item { _metadata { url { default hierarchical } } }
  }
}`;

/**
 * Splits a Graph `docId` (`{uuid}_{locale}_{status}`) into the content id
 * without dashes and the Graph locale. Locale names can contain underscores.
 */
export const parseDocId = (docId: string) => {
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
 * Resolves the `docId` of a Graph webhook to the URL paths of that content:
 * its default URL and, when different, its hierarchical one. Empty when Graph
 * has no URL for it.
 */
export async function resolveDocPaths(docId: string): Promise<string[]> {
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
  const urls = data?._Content?.item?._metadata?.url;
  // With a simple address set, url.default is that address and the page also lives at url.hierarchical
  const paths = [urls?.default, urls?.hierarchical]
    .filter((it): it is string => Boolean(it))
    .map(toPath);

  return [...new Set(paths)];
}
