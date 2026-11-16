import { parseDocId } from './graph.js';
import { createCacheStore } from './redis.js';

// Longer than the CDN keeps a page (s-maxage of a year), so a cached URL is not forgotten first
const TTL_SECONDS = 400 * 24 * 60 * 60;

// URLs belong to the CMS content, not to a deployment, so a redeploy keeps them
const store = createCacheStore('webhook', { sharedAcrossDeployments: true });

// One entry per content item and locale, so a publish and an expiry share it
const toKey = (docId: string) => {
  const { id, locale } = parseDocId(docId);
  return `docs/${id}_${locale}`;
};

/** Stores the URL paths a content item was last published at. */
export const rememberDocPaths = (docId: string, paths: string[]) =>
  store.set(toKey(docId), paths, TTL_SECONDS);

/** The URL paths a content item was last published at, or none. */
export const recallDocPaths = async (docId: string) =>
  (await store.get<string[]>(toKey(docId))) ?? [];

/** Drops the stored paths of deleted content items. */
export const forgetDocPaths = (docIds: string[]) => store.delete(docIds.map(toKey));
