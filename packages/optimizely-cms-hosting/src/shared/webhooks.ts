import { log } from '../util/general.js';
import { envGraphGateway, envSiteHostname } from './env.js';

type Webhook = {
  id: string;
  disabled?: boolean;
  request?: { url?: string; headers?: Record<string, string> };
};

/** Options for {@link registerWebhook}. */
export type RegisterWebhookOptions = {
  /** Path of the route that receives Graph webhooks. Defaults to `/hooks/graph`. */
  callbackPath?: string;
};

const REQUEST_TIMEOUT_MS = 10_000;

const missingVariables = (variables: Record<string, string | undefined>) =>
  Object.entries(variables)
    .filter(([, value]) => !value)
    .map(([name]) => name);

const createWebhooksApi = (appKey: string, secret: string) => {
  const endpoint = `${envGraphGateway()}/api/webhooks`;
  // btoa rather than Buffer, so the module also loads in the Next.js Edge runtime
  const authorization = `Basic ${btoa(`${appKey}:${secret}`)}`;

  const request = async (path: string, init: RequestInit = {}) => {
    const requestName = `${init.method ?? 'GET'} /api/webhooks${path}`;
    const response = await fetch(`${endpoint}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: authorization },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`${requestName} failed (${response.status})`);
    return response;
  };

  return {
    list: async () => (await (await request('')).json()) as Webhook[],
    remove: (id: string) => request(`/${id}`, { method: 'DELETE' }),
    create: (url: string, callbackApiKey: string) =>
      request('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disabled: false,
          request: { url, method: 'post', headers: { 'x-api-key': callbackApiKey } },
          topic: ['*.*'],
          filters: [{ status: { eq: 'Published' } }],
        }),
      }),
  };
};

/**
 * Registers the Optimizely Graph webhook that calls the site on publish, unless
 * it already exists, and removes duplicates left by instances starting at the
 * same time, as well as disabled ones and ones with an outdated API key. Logs and does nothing when the platform variables are missing, and
 * logs instead of throwing when Graph cannot be reached.
 */
export async function registerWebhook({
  callbackPath = '/hooks/graph',
}: RegisterWebhookOptions = {}) {
  const appKey = process.env.OPTIMIZELY_GRAPH_APP_KEY;
  const secret = process.env.OPTIMIZELY_GRAPH_SECRET;
  const callbackApiKey = process.env.OPTIMIZELY_GRAPH_CALLBACK_APIKEY;
  const hostname = envSiteHostname();

  if (!appKey || !secret || !callbackApiKey || !hostname) {
    const missing = missingVariables({
      OPTIMIZELY_GRAPH_APP_KEY: appKey,
      OPTIMIZELY_GRAPH_SECRET: secret,
      OPTIMIZELY_GRAPH_CALLBACK_APIKEY: callbackApiKey,
      OPTIMIZELY_SITE_HOSTNAME: hostname,
    });

    log.info(`Graph webhook not registered, missing ${missing.join(', ')}`);
    return;
  }

  try {
    const webhooks = createWebhooksApi(appKey, secret);
    const url = `https://${hostname}${callbackPath}`;
    const matching = (await webhooks.list()).filter(it => it.request?.url === url);
    // A disabled webhook, or one with a rotated API key, would leave the site without calls
    const usable = matching.filter(
      it => !it.disabled && it.request?.headers?.['x-api-key'] === callbackApiKey,
    );
    // Every instance sorts the same way, so they all keep the same webhook
    const [kept, ...duplicates] = usable.sort((a, b) => b.id.localeCompare(a.id));
    const outdated = [...matching.filter(it => !usable.includes(it)), ...duplicates];

    if (outdated.length) {
      await Promise.all(outdated.map(it => webhooks.remove(it.id)));
      log.info(
        `Removed ${outdated.length} outdated or duplicate Graph webhooks for ${url}`,
      );
    }

    if (!kept) {
      await webhooks.create(url, callbackApiKey);
      log.info(`Registered the Graph webhook for ${url}`);
    } else if (!outdated.length) {
      log.info(`The Graph webhook for ${url} is already registered`);
    }
  } catch (error) {
    log.warn('Graph webhook registration failed', error);
  }
}
