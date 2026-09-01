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

    // The probe lives in the one metadata query and is switched off with
    // `@include`, so what matters is the flag, not the query text.
    expect((metadataCalls()[0][1] as { withForms: boolean }).withForms).toBe(false);
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

describe('a form in a content area rather than a composition', () => {
  const PageType = contentType({
    key: 'Standard',
    displayName: 'Standard',
    baseType: '_page',
    properties: {
      extras: {
        type: 'array',
        items: { type: 'content', allowedTypes: ['_component', '_section'] },
      },
    },
  });

  const PlainPageType = contentType({
    key: 'Plain',
    displayName: 'Plain',
    baseType: '_page',
    properties: { title: { type: 'string' } },
  });

  /** Stubs Graph as a page of `typeName` with no form in any composition. */
  const stubPage = (typeName: string) => {
    mockRequest = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
      if (query.includes('GetContentMetadata')) {
        return {
          _Content: { item: { _metadata: { types: [typeName] } } },
          damAssetType: null,
          formsOnPage: { total: 0 },
        };
      }
      return { _Content: { item: { __typename: typeName } } };
    });
  };

  beforeEach(() => {
    initContentTypeRegistry([PageType, PlainPageType, ...FormContentTypes]);
    refreshCache();
  });

  // The probe asks `_Experience`, and a page's content area is not a
  // composition, so it reports nothing. Without the content model as a second
  // opinion the form fragments are dropped and the form renders as a bare title.
  test('includes form fragments, though the probe found none', async () => {
    stubPage('Standard');

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('fragment OptiFormsContainerData');
  });

  // Graph resolves a section's composition only when asked for that section, so
  // the field comes back empty here and the client fetches it separately. The
  // field still has to be in the query: it is how an empty one is told from a
  // form that simply has no steps.
  test('asks the container for its own composition', async () => {
    stubPage('Standard');

    await client.getContent({ key: 'a' });

    const containerFragment =
      contentQuery().match(/fragment OptiFormsContainerData on [\s\S]*?\n/)?.[0] ?? '';
    expect(containerFragment).toContain('composition { ...ICompositionNode }');
  });

  // `_section` alone reaches nothing: base-type expansion matches on the
  // declared `baseType`, and the container declares `_component`. A content
  // area meant for a form has to allow `_component`, `*`, or the container by
  // name — the same rule any section-enabled component already follows.
  test('is not detected through a content area that allows only sections', async () => {
    const SectionAreaPage = contentType({
      key: 'SectionArea',
      displayName: 'Section Area',
      baseType: '_page',
      properties: {
        extras: { type: 'array', items: { type: 'content', allowedTypes: ['_section'] } },
      },
    });
    initContentTypeRegistry([SectionAreaPage, ...FormContentTypes]);
    refreshCache();
    stubPage('SectionArea');

    await client.getContent({ key: 'a' });

    expect(contentQuery()).not.toContain('OptiForms');
  });

  test('still leaves them out for a page that cannot hold a form', async () => {
    stubPage('Plain');

    await client.getContent({ key: 'a' });

    expect(contentQuery()).not.toContain('OptiForms');
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
