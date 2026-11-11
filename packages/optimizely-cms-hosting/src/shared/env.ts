/**
 * `OPTIMIZELY_SITE_HOSTNAME` as a bare hostname. The platform has been seen
 * setting it both with and without a scheme.
 */
export const envSiteHostname = () => {
  const hostname = process.env.OPTIMIZELY_SITE_HOSTNAME ?? '';
  return hostname.replace(/^https?:\/\//i, '').replace(/\/+$/, '') || undefined;
};

/**
 * Origin of the Optimizely Graph gateway. `OPTIMIZELY_GRAPH_GATEWAY` may
 * include the `/content/v2` query path, which the webhooks API does not use.
 */
export const envGraphGateway = () =>
  (process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com')
    .replace(/\/+$/, '')
    .replace(/\/content\/v2$/, '');
