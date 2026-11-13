import { log, secretsMatch } from '../util/general.js';
import { getSiteHostnames, purgeCdnCache } from './cdn.js';
import { resolveDocPaths } from './graph.js';

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

// INVALIDATION

// The CDN caches a page separately with and without the trailing slash
const toPurgeUrls = (hostnames: string[], paths: string[]) =>
  hostnames.flatMap(hostname =>
    paths
      .flatMap(path => (path === '/' ? [path] : [path, `${path}/`]))
      .map(path => `https://${hostname}${path}`),
  );

const purge = (urls?: string[]) =>
  purgeCdnCache(urls).catch(error => log.error('CDN purge failed', error));

const handleDocChange = async (docId: string, cache: OriginCache) => {
  const docPaths = await resolveDocPaths(docId).catch(error => {
    log.error(`Resolving ${docId} failed`, error);
    return [];
  });

  // Unpublished content may have no URL left in Graph; the home page still changes
  if (!docPaths.length)
    log.warn(`No URL found for ${docId}, refreshing only the home page`);

  // The home page commonly lists other pages, so every change refreshes it
  const paths = [...new Set([...docPaths, '/'])];

  // Origin first: a CDN purged earlier could fetch the old page again
  await Promise.all(paths.map(it => cache.invalidate(it)));
  log.info(`Refreshed ${paths.join(' and ')} in the origin cache`);
  await purge(toPurgeUrls(await getSiteHostnames(), paths));
};

// Graph does not say which documents a bulk deletion removed
const handleBulkDeletion = async (cache: OriginCache) => {
  await cache.clear();
  log.info('Cleared the origin cache after a bulk deletion');
  await purge();
};

const hasDeletions = (payload: WebhookPayload) =>
  Object.values(payload.data?.items ?? {}).includes('deleted');

/**
 * Handles an Optimizely Graph webhook: checks the `x-api-key` header, then
 * drops the changed page and the home page from the origin cache and the CDN.
 * A bulk deletion clears the whole deployment from the origin cache.
 */
export async function handleGraphWebhook(request: Request, cache: OriginCache) {
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

  log.info(
    `Received the Graph webhook ${subject}.${action}${docId ? ` for ${docId}` : ''}`,
  );

  if (subject === 'doc' && (action === 'updated' || action === 'expired') && docId)
    await handleDocChange(docId, cache);
  else if (subject === 'bulk' && action === 'completed' && hasDeletions(payload))
    await handleBulkDeletion(cache);

  return Response.json({ received: true });
}
