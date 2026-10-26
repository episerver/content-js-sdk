import { createStandalonePreview } from '@optimizely/cms-sdk/react/server';
import { faker } from '@faker-js/faker';

/** The origin part of a URL, or nothing if it is unset or unparseable. */
function originOf(url: string | undefined) {
  try {
    return url ? new URL(url).origin : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Who may read a preview's measurements.
 *
 * The CMS is the usual embedder, so its own URL is the default and nothing
 * extra needs configuring. `PREVIEW_PARENT_ORIGIN` adds to that list — a local
 * preview tool, or a second CMS environment — as comma-separated origins.
 */
const parentOrigin = [
  originOf(process.env.OPTIMIZELY_CMS_URL),
  ...(process.env.PREVIEW_PARENT_ORIGIN?.split(',') ?? []).map(origin => origin.trim()),
].filter(Boolean) as string[];

export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: faker,
  parentOrigin,
});
