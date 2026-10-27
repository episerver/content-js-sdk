import { createStandalonePreview } from '@optimizely/cms-sdk/react/standalone';
import { faker } from '@faker-js/faker';

/**
 * The CMS is the page that embeds these previews, and the only one allowed to
 * read their measurements. An embedder cannot ask to be told — the site says
 * who it reports to.
 */
export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: faker,
  parentOrigin: process.env.OPTIMIZELY_CMS_URL,
});
