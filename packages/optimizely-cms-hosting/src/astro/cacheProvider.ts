import type { CacheOptions, CacheProvider, CacheProviderFactory } from 'astro';
import {
  buildCacheControlDirectives,
  normalizeTags,
  setConditionalHeaders,
} from 'astro/cache/provider-utils';
import { createCacheStore } from '../shared/redis.js';
import { log, normalizePath } from '../util/general.js';

type OnRequest = NonNullable<CacheProvider['onRequest']>;
type RequestContext = Parameters<OnRequest>[0];
type Next = Parameters<OnRequest>[1];
type CacheState = 'HIT' | 'STALE' | 'MISS';
type Entry = {
  body: Buffer;
  headers: [string, string][];
  storedAt: number;
  maxAge: number;
  swr: number;
};

// Copy of the default list in Astro's memory provider, which Astro does not export
const IGNORED_QUERY_PARAMS = new Set([
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'dclid',
  'msclkid',
  'twclid',
  'li_fat_id',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gl',
  '_hsenc',
  '_hsmi',
  '_ke',
  'oly_anon_id',
  'oly_enc_id',
  'rb_clickid',
  's_cid',
  'vero_id',
  'wickedid',
  'yclid',
  '__s',
  'ref',
]);
// Where Astro attaches cookies set through Astro.cookies before they become headers
const ASTRO_COOKIES = Symbol.for('astro.cookies');

const store = createCacheStore('astro');

/** Deletes every cached page of this deployment. */
export const clearPages = () => store.clear();

// CACHE KEYS AND HEADERS

// Requests with a meaningful query are not cached, so a path maps to a single entry
const hasQuery = (url: URL) =>
  [...url.searchParams.keys()].some(key => {
    const smallKey = key.toLowerCase();
    return !smallKey.startsWith('utm_') && !IGNORED_QUERY_PARAMS.has(smallKey);
  });

const readDirective = (header: string, directive: string) =>
  Number(header.match(new RegExp(`(?:^|[\\s,])${directive}=(\\d+)`, 'i'))?.[1] ?? 0);

const setsCookies = (response: Response) => {
  const cookies = Reflect.get(response, ASTRO_COOKIES) as
    | { headers(): Iterator<string> }
    | undefined;
  return response.headers.has('set-cookie') || cookies?.headers().next().done === false;
};

const varies = (response: Response) =>
  (response.headers.get('vary') ?? '')
    .split(',')
    .map(header => header.trim().toLowerCase())
    .some(header => header && header !== 'accept-encoding');

// ENTRIES

// Reads the body of a cacheable response, which is then answered from the entry
const toEntry = async (response: Response): Promise<Entry | null> => {
  // Written by setHeaders from routeRules; Astro strips it before the response leaves
  const cdnCacheControl = response.headers.get('CDN-Cache-Control') ?? '';
  const maxAge = readDirective(cdnCacheControl, 'max-age');

  if (!maxAge || response.status !== 200 || setsCookies(response) || varies(response))
    return null;

  return {
    body: Buffer.from(await response.arrayBuffer()),
    headers: [...response.headers],
    storedAt: Date.now(),
    maxAge,
    swr: readDirective(cdnCacheControl, 'stale-while-revalidate'),
  };
};

const toResponse = (entry: Entry, state: CacheState, ageSeconds: number) => {
  // The Buffer wraps a plain ArrayBuffer (from arrayBuffer() or base64), so no copy is needed
  const body = entry.body as Uint8Array<ArrayBuffer>;
  const response = new Response(body, { headers: entry.headers });

  // Lets the CDN subtract the time already spent in Redis from s-maxage
  response.headers.set('Age', String(Math.floor(ageSeconds)));
  response.headers.set('X-Astro-Cache', state);
  return response;
};

const ttlFor = (entry: Entry) => entry.maxAge + entry.swr;

// PROVIDER

/** Astro cache provider backed by the platform's Redis, shared by every instance. Invalidates by path only. */
const factory: CacheProviderFactory = () => {
  const refreshing = new Set<string>();

  const refresh = (key: string, context: RequestContext, next: Next) => {
    if (refreshing.has(key)) return;
    refreshing.add(key);

    const task = next()
      .then(toEntry)
      // An uncacheable result (e.g. a 404 after unpublishing) must not leave the stale page behind
      .then(entry => (entry ? store.set(key, entry, ttlFor(entry)) : store.delete([key])))
      .catch(error => log.warn(`Background refresh of ${key} failed`, error))
      .finally(() => refreshing.delete(key));

    context.waitUntil?.(task);
  };

  return {
    name: 'optimizely-redis',

    setHeaders(options: CacheOptions) {
      const headers = new Headers();
      const { maxAge, swr, tags } = options;

      if (maxAge) {
        // s-maxage rather than max-age, so browsers do not keep pages the webhook has purged
        const sharedCacheOnly = ['public', 'max-age=0', `s-maxage=${maxAge}`];

        headers.set('CDN-Cache-Control', buildCacheControlDirectives({ maxAge, swr })!);
        headers.set(
          'Cache-Control',
          buildCacheControlDirectives({ swr }, sharedCacheOnly)!,
        );
      }
      if (tags?.length) headers.set('Cache-Tag', tags.join(', '));
      setConditionalHeaders(headers, options);
      return headers;
    },

    async onRequest(context, next) {
      const { request, url } = context;
      if (request.method !== 'GET' || hasQuery(url)) return next();

      const key = normalizePath(url.pathname);
      const cached = await store.get<Entry>(key);
      const ageSeconds = cached ? (Date.now() - cached.storedAt) / 1000 : 0;

      if (cached && ageSeconds <= ttlFor(cached)) {
        const isStale = ageSeconds > cached.maxAge;

        if (isStale) refresh(key, context, next);
        return toResponse(cached, isStale ? 'STALE' : 'HIT', ageSeconds);
      }

      const response = await next();
      const entry = await toEntry(response);
      if (!entry) return response;

      // Started outside waitUntil?.(), which skips its argument when the adapter has no waitUntil
      const write = store.set(key, entry, ttlFor(entry));
      // The visitor does not wait for the write
      context.waitUntil?.(write);
      return toResponse(entry, 'MISS', 0);
    },

    async invalidate({ path, tags }) {
      const tagList = normalizeTags(tags);

      if (tagList.length) log.warn(`Ignoring unsupported tags: ${tagList.join(', ')}`);
      if (path) await store.delete([normalizePath(path)]);
    },
  };
};

export default factory;
