import { createStandalonePreview } from '@optimizely/cms-sdk/react/standalone';
import { faker } from '@faker-js/faker';

/**
 * Renders one component on a page of its own, for the CMS to embed.
 *
 * Measurements go to `OPTIMIZELY_CMS_URL`, which is where the CMS is. Pass
 * `parentOrigin` to report somewhere else instead.
 */
export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: faker,
  parentOrigin: 'http://localhost:5173/',
});
