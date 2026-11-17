import { GraphClient } from '@optimizely/cms-sdk';
import { toPath, unique, withTimeout } from '../util/general.js';

type Urls = { default?: string | null; hierarchical?: string | null };
type PathResponse = { _Content?: { item?: { _metadata?: { url?: Urls } } } };

const PATH_QUERY = `
query ResolveDocPaths($id: String, $locale: Locales) {
  _Content(ids: [$id], locale: [$locale]) {
    item { _metadata { url { default hierarchical } } }
  }
}`;

/**
 * Splits a Graph `docId` (`{uuid}[_{version}]_{locale}_{status}`) into the
 * content id without dashes, the Graph locale and the status, such as
 * `Published` or `Previous`. Locale names can contain underscores.
 */
export const parseDocId = (docId: string) => {
  const [uuid, ...rest] = docId.split('_');
  const middle = rest.slice(0, -1);
  // Version-specific docIds carry a numeric version before the locale; no locale is numeric
  const localeParts = /^\d+$/.test(middle[0] ?? '') ? middle.slice(1) : middle;

  return {
    id: uuid.replaceAll('-', ''),
    locale: localeParts.join('_').replaceAll('-', '_'),
    status: rest.at(-1) ?? '',
  };
};

const LOOKUP_TIMEOUT_MS = 10_000;

/**
 * Resolves the `docId` of a Graph webhook to the URL paths of that content:
 * its default URL and, when different, its hierarchical one. Empty when Graph
 * has no URL for it.
 */
export async function resolveDocPaths(docId: string): Promise<string[]> {
  const singleKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
  if (!singleKey) throw new Error('OPTIMIZELY_GRAPH_SINGLE_KEY is not set');

  // GraphClient normalizes the gateway itself and defaults it when unset
  const client = new GraphClient(singleKey, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });
  const { id, locale } = parseDocId(docId);
  // Uncached, so content that was just moved resolves to its new URL
  const lookup = client.request(PATH_QUERY, { id, locale }, undefined, false);
  const data: PathResponse = await withTimeout(lookup, LOOKUP_TIMEOUT_MS, 'Graph lookup');
  const urls = data?._Content?.item?._metadata?.url;
  // With a simple address set, url.default is that address and the page also lives at
  // url.hierarchical; url.default is absolute when the content's application has a host
  const paths = [urls?.default, urls?.hierarchical]
    .filter((it): it is string => Boolean(it))
    .map(toPath);

  return unique(paths);
}
