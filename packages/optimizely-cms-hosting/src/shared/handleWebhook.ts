import { log, secretsMatch, toPath, unique } from '../util/general.js';
import { purgeCdnPaths } from './cdn.js';
import { forgetDocPaths, recallDocPaths, rememberDocPaths } from './docPaths.js';
import { parseDocId, resolveDocPaths } from './graph.js';

type WebhookPayload = {
  type?: { subject?: string; action?: string };
  data?: { docId?: string; items?: Record<string, string> };
};

/** How a framework drops pages from its origin cache. */
export type OriginCache = {
  /** Removes one path. Must have taken effect when the promise resolves. */
  invalidate(path: string): Promise<void>;
  /** Removes every page of the deployment. */
  clear(): Promise<void>;
};

/** A content item a webhook refreshes, with the URL paths it is known at. */
export type ContentChange = {
  docId: string;
  /** The Graph locale, such as `en` or `zh_Hans`. */
  locale: string;
  paths: string[];
};

/** Options for the Graph webhook route. */
export type WebhookOptions = {
  /**
   * Paths to refresh as well as the content's own URLs, such as listing pages.
   * Defaults to {@link homePagePaths}.
   */
  alsoRefresh?: (change: ContentChange) => string[];
};

/**
 * The site root and the home page of the content's locale (`/en` for
 * `/en/news/article`), since home pages commonly list other pages. The
 * default of `alsoRefresh`.
 */
export const homePagePaths = ({ locale, paths }: ContentChange) => {
  const localeSegment = locale.toLowerCase().replaceAll('_', '-');
  const localeHomes = paths
    .map(path => path.split('/')[1])
    .filter(segment => segment?.toLowerCase() === localeSegment)
    .map(segment => `/${segment}`);

  return ['/', ...localeHomes];
};

// REQUEST

// Why the request is not from Graph, or undefined when it is
const authorizationProblem = (request: Request) => {
  const provided = request.headers.get('x-api-key');
  const expected = process.env.OPTIMIZELY_GRAPH_CALLBACK_APIKEY;

  if (!expected) return 'OPTIMIZELY_GRAPH_CALLBACK_APIKEY is not set';
  if (!provided) return 'no x-api-key header';
  if (!secretsMatch(provided, expected)) return 'wrong x-api-key';
  return undefined;
};

// Read as text: Graph sends the JSON body as text/plain
const parsePayload = async (request: Request) => {
  try {
    const payload: unknown = JSON.parse(await request.text());
    return payload && typeof payload === 'object' && !Array.isArray(payload) ?
        (payload as WebhookPayload)
      : undefined;
  } catch {
    return undefined;
  }
};

// Only published versions had pages; Graph also lists deleted drafts and previous versions
const deletedDocIds = (payload: WebhookPayload) =>
  Object.entries(payload.data?.items ?? {})
    .filter(([, status]) => status === 'deleted')
    .map(([docId]) => docId)
    .filter(docId => parseDocId(docId).status === 'Published');

// INVALIDATION

// alsoRefresh paths come from site code, so they are normalized like Graph's
const withAlsoRefreshed = (docId: string, paths: string[], options: WebhookOptions) => {
  const alsoRefresh = options.alsoRefresh ?? homePagePaths;
  const locale = parseDocId(docId).locale;

  return [...paths, ...alsoRefresh({ docId, locale, paths }).map(toPath)];
};

const refresh = async (paths: string[], cache: OriginCache) => {
  // Origin first: a CDN purged earlier could fetch the old page again
  const results = await Promise.allSettled(paths.map(it => cache.invalidate(it)));
  const refreshed = paths.filter((_, index) => results[index].status === 'fulfilled');
  const failures = results.filter(it => it.status === 'rejected');

  if (refreshed.length) log.info(`Refreshed ${refreshed.join(', ')} in the origin cache`);
  if (failures.length) {
    const failed = paths.filter((_, index) => results[index].status === 'rejected');
    log.error(
      `Refreshing ${failed.join(', ')} failed, the old page stays cached`,
      failures[0].reason,
    );
  }

  await purgeCdnPaths(paths).catch(error => log.error('CDN purge failed', error));
};

const handleDocChange = async (
  docId: string,
  cache: OriginCache,
  options: WebhookOptions,
) => {
  const [resolved, remembered] = await Promise.all([
    resolveDocPaths(docId).catch(error => {
      log.error(`Resolving ${docId} failed`, error);
      return [];
    }),
    recallDocPaths(docId),
  ]);

  // Expired content has no URL left in Graph, but its last known URLs still hold the old page
  if (!resolved.length && !remembered.length) log.warn(`No URL known for ${docId}`);
  if (resolved.length) await rememberDocPaths(docId, resolved);

  // Remembered paths also cover content that moved: its old URL still holds the old page
  const paths = unique([...resolved, ...remembered]);
  await refresh(unique(withAlsoRefreshed(docId, paths, options)), cache);
};

const handleBulkDeletion = async (
  docIds: string[],
  cache: OriginCache,
  options: WebhookOptions,
) => {
  const deleted = await Promise.all(
    docIds.map(async docId => ({
      docId,
      id: parseDocId(docId).id,
      paths: await recallDocPaths(docId),
    })),
  );
  const knownIds = new Set(deleted.filter(it => it.paths.length).map(it => it.id));
  // Graph lists every locale of deleted content; with one known, the others most likely had no page
  const unknown = deleted.filter(it => !knownIds.has(it.id)).map(it => it.docId);

  // Without a known URL, the deleted content could have been on any page
  if (unknown.length) {
    await cache.clear();
    log.info(`Cleared the origin cache, no URL known for deleted ${unknown.join(', ')}`);
  }

  const paths = deleted.flatMap(it => withAlsoRefreshed(it.docId, it.paths, options));
  await refresh(unique(paths), cache);
  await forgetDocPaths(docIds);
};

/**
 * Handles an Optimizely Graph webhook: checks the `x-api-key` header, then
 * drops the changed content's pages, and the additional paths, from the origin
 * cache and the CDN.
 */
export async function handleGraphWebhook(
  request: Request,
  cache: OriginCache,
  options: WebhookOptions = {},
) {
  const problem = authorizationProblem(request);

  if (problem) {
    log.warn(`Rejected a Graph webhook: ${problem}`);
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await parsePayload(request);

  if (!payload) {
    log.warn('Rejected a Graph webhook: the body is not a JSON object');
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { subject, action } = payload.type ?? {};
  const docId = payload.data?.docId;
  const deleted = deletedDocIds(payload);

  log.info(
    `Received the Graph webhook ${subject}.${action}${docId ? ` for ${docId}` : ''}`,
  );

  if (subject === 'doc' && (action === 'updated' || action === 'expired') && docId)
    await handleDocChange(docId, cache, options);
  else if (subject === 'bulk' && action === 'completed' && deleted.length)
    await handleBulkDeletion(deleted, cache, options);

  return Response.json({ received: true });
}
