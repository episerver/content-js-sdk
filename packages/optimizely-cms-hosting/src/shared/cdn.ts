import { ManagedIdentityCredential, type TokenCredential } from '@azure/identity';
import { log, withTimeout } from '../util/general.js';
import { envSiteHostname } from './env.js';

type PlatformApi = { url: string; resourceId: string };
type Hostname = { hostname: string; isCustomHostname?: boolean };

const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const SLOT_HOSTNAME = /-slot\./i;

let credential: TokenCredential | undefined;
let cachedToken: { token: string; expiresAt: number } | undefined;
let hostnamesRequest: Promise<string[]> | undefined;

// PLATFORM API

const platformApi = (): PlatformApi | undefined => {
  const url = process.env.OPTIMIZELY_CLOUDPLATFORM_API_URL?.replace(/\/+$/, '');
  const resourceId = process.env.OPTIMIZELY_CLOUDPLATFORM_API_RESOURCE_ID;

  return url && resourceId ? { url, resourceId } : undefined;
};

const getToken = async (resourceId: string) => {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now())
    return cachedToken.token;

  // Without AZURE_CLIENT_ID this uses the system-assigned identity
  credential ??= new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID });

  const tokenRequest = credential.getToken(`${resourceId}/.default`);
  const accessToken = await withTimeout(
    tokenRequest,
    REQUEST_TIMEOUT_MS,
    'Managed identity',
  );
  if (!accessToken) throw new Error('managed identity returned no token');

  cachedToken = { token: accessToken.token, expiresAt: accessToken.expiresOnTimestamp };
  return accessToken.token;
};

const requestPlatform = async (
  api: PlatformApi,
  path: string,
  init: RequestInit = {},
) => {
  const token = await getToken(api.resourceId);
  const response = await fetch(`${api.url}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok)
    throw new Error(`${path} failed (${response.status}): ${await response.text()}`);
  return response;
};

// HOSTNAMES

// Slots serve another deployment, so their pages are not the ones being purged
const fetchSiteHostnames = async (api: PlatformApi) => {
  const response = await requestPlatform(api, '/v1/environment/hostnames');
  const { items = [] } = (await response.json()) as { items?: Hostname[] };
  const hostnames = items.map(it => it.hostname).filter(it => !SLOT_HOSTNAME.test(it));

  if (!hostnames.length) throw new Error('the platform returned no site hostnames');
  return hostnames;
};

const envHostnames = () => [envSiteHostname()].filter(it => it !== undefined);

/**
 * Hostnames the site is served on (custom and default, not deployment slots),
 * from the Cloud Platform API. Falls back to `OPTIMIZELY_SITE_HOSTNAME`.
 */
export async function getSiteHostnames(): Promise<string[]> {
  const api = platformApi();
  if (!api) return envHostnames();

  // One lookup per process, shared by concurrent calls
  hostnamesRequest ??= fetchSiteHostnames(api).catch(error => {
    // Not cached, so the next call retries the lookup
    hostnamesRequest = undefined;
    log.error('Site hostname lookup failed, using OPTIMIZELY_SITE_HOSTNAME', error);
    return envHostnames();
  });

  return hostnamesRequest;
}

// PURGE

/**
 * Purges `urls` (default: the root of every site hostname) from the platform
 * CDN. Skips with a warning when the Cloud Platform API is not configured and
 * throws when the purge request fails.
 */
export async function purgeCdnCache(urls?: string[]) {
  const api = platformApi();

  if (!api) {
    log.warn('CDN purge skipped: the Cloud Platform API URL or resource ID is not set');
    return;
  }

  const purgeUrls = urls ?? (await getSiteHostnames()).map(it => `https://${it}/`);

  if (!purgeUrls.length) {
    log.warn('CDN purge skipped: no URLs to purge');
    return;
  }

  const response = await requestPlatform(api, '/v1/edge-cache/purge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: purgeUrls }),
  });
  const { operationId } = (await response.json().catch(() => ({}))) as {
    operationId?: string;
  };

  log.info(`CDN purge accepted (operation ${operationId ?? 'unknown'})`);
}

// The CDN caches a page separately with and without the trailing slash
const toUrls = (hostname: string, path: string) =>
  (path === '/' ? [path] : [path, `${path}/`]).map(it => `https://${hostname}${it}`);

/** Purges URL paths from the platform CDN on every site hostname. */
export const purgeCdnPaths = async (paths: string[]) => {
  const urls = (await getSiteHostnames()).flatMap(hostname =>
    paths.flatMap(path => toUrls(hostname, path)),
  );
  return purgeCdnCache(urls);
};
