import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { FormContentTypes } from '../../model/formContentTypes.js';

/**
 * Form fragments more than double an experience query and are only useful on
 * pages that actually contain a form, so the metadata request carries a probe
 * for that and the content query leaves them out page by page.
 *
 * The probe filters on `composition.nodes.type`, an ordinary string field rather
 * than a reference to a schema type. It is therefore valid whether or not
 * Optimizely Forms is enabled, which is why it can go out on the very first
 * request and why no separate schema introspection is needed.
 */

const ExperienceType = contentType({
  key: 'Landing',
  displayName: 'Landing',
  baseType: '_experience',
  properties: {},
});

const metadataResponse = {
  _Content: { item: { _metadata: { types: ['Landing'] } } },
  damAssetType: null,
};

const contentResponse = { _Content: { item: { __typename: 'Landing' } } };

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

/** Stubs Graph so this page reports the given number of form containers. */
function stubGraph(formsOnPage: number) {
  mockRequest = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetContentMetadata')) {
      return { ...metadataResponse, formsOnPage: { total: formsOnPage } };
    }
    return contentResponse;
  });
}

/** The generated content query, i.e. the request that isn't the metadata one. */
const contentQuery = (): string =>
  mockRequest.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .filter((q: string) => !q.includes('GetContentMetadata'))
    .at(-1) ?? '';

const metadataCalls = () =>
  mockRequest.mock.calls.filter((call: unknown[]) =>
    String(call[0]).includes('GetContentMetadata'),
  );

/** Registers the form content types, as `initForms` would. */
const withForms = () => {
  initContentTypeRegistry([ExperienceType, ...FormContentTypes]);
  refreshCache();
};

const withoutForms = () => {
  initContentTypeRegistry([ExperienceType]);
  refreshCache();
};

beforeEach(() => {
  withForms();
  client = new GraphClient('test-key');
});

describe('probing whether a page has a form', () => {
  // No schema lookup has to happen first, so there is no warm-up request that
  // misses out and no cached state to keep between requests.
  test('rides along on the very first request', async () => {
    stubGraph(0);

    await client.getContent({ key: 'a' });

    expect(metadataCalls()).toHaveLength(1);
    expect(metadataCalls()[0][0]).toContain('formsOnPage');
    expect(contentQuery()).not.toContain('OptiForms');
  });

  test('costs exactly one request per page fetch', async () => {
    stubGraph(0);

    await client.getContent({ key: 'a' });

    // Metadata plus content. An introspection round trip used to sit in between.
    expect(mockRequest.mock.calls).toHaveLength(2);
  });

  test('is skipped when the application never registered the form types', async () => {
    withoutForms();
    stubGraph(0);

    await client.getContent({ key: 'a' });

    expect(metadataCalls()[0][0]).not.toContain('formsOnPage');
    expect(contentQuery()).not.toContain('OptiForms');
  });

  test('narrows the page filter to compositions holding a form container', async () => {
    stubGraph(1);

    await client.getContent({ key: 'b' });

    const variables = metadataCalls()[0][1] as { formsWhere: unknown };
    expect(JSON.stringify(variables.formsWhere)).toContain('OptiFormsContainerData');
    // The page's own filter has to survive, or the probe answers about the wrong page.
    expect(JSON.stringify(variables.formsWhere)).toContain('"key":{"eq":"b"}');
  });
});

describe('the generated content query', () => {
  test('leaves out form fragments when the page has no form', async () => {
    stubGraph(0);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).not.toContain('OptiForms');
  });

  test('includes form fragments when the page has a form', async () => {
    stubGraph(1);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('fragment OptiFormsContainerData');
    expect(contentQuery()).toContain('fragment OptiFormsTextboxElement');
  });

  // A fresh client per request is what a framework does; nothing may depend on
  // state carried over from a previous one.
  test('decides per page, whoever asks', async () => {
    stubGraph(1);
    await client.getContent({ key: 'has-form' });
    expect(contentQuery()).toContain('fragment OptiFormsContainerData');

    client = new GraphClient('test-key');
    stubGraph(0);
    await client.getContent({ key: 'no-form' });
    expect(contentQuery()).not.toContain('OptiForms');
  });
});
