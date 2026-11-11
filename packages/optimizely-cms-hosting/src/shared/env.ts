/**
 * `OPTIMIZELY_SITE_HOSTNAME` as a bare hostname. The platform has been seen
 * setting it both with and without a scheme.
 */
export const envSiteHostname = () => {
  const hostname = process.env.OPTIMIZELY_SITE_HOSTNAME ?? '';
  return hostname.replace(/^https?:\/\//i, '').replace(/\/+$/, '') || undefined;
};
