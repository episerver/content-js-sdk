import { describe, expect, test, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { FormContentTypes } from '../../model/formContentTypes.js';
import { type GraphRequestSpy, metadataResponse, stubGraph } from './helpers.js';

/**
 * Graph resolves a section's `composition` only when that section is the content
 * being asked for. Reached through a content area the field comes back empty, so
 * the client fetches those containers on their own and fills the steps in.
 */

const PageType = contentType({
  key: 'Standard',
  displayName: 'Standard',
  baseType: '_page',
  properties: {
    extras: { type: 'array', items: { type: 'content', allowedTypes: ['_component'] } },
  },
});

const STEPS = [
  { __typename: 'CompositionStructureNode', nodeType: 'step', key: 'step-1' },
];

const NO_FORMS_PROBE = { formsOnPage: { total: 0 } };

/** A container as it arrives inside a content area: no steps. */
const nestedForm = (key = 'form-1') => ({
  __typename: 'OptiFormsContainerData',
  _metadata: { key, locale: 'en', types: ['OptiFormsContainerData'] },
  composition: { key: null, nodes: [] },
});

/** A container asked for directly, which Graph does resolve. */
const resolvedForm = (key: string, nodes: unknown[] = STEPS) => ({
  _Content: {
    item: {
      __typename: 'OptiFormsContainerData',
      _metadata: { key },
      composition: { nodeType: 'section', key, nodes },
    },
  },
});

const isFormKey = (key: unknown) => typeof key === 'string' && /^form-\d$/.test(key);

let client: GraphClient;

/** Stubs the page fetch, plus the direct fetch the client should make for each form. */
const stubPage = (extras: unknown[]) =>
  stubGraph(client, {
    metadata: metadataResponse(['Standard'], NO_FORMS_PROBE),
    content: variables =>
      isFormKey(variables?.key) ?
        resolvedForm(variables.key)
      : { _Content: { item: { __typename: 'Standard', Standard__extras: extras } } },
  });

/** Stubs a form container requested on its own. */
const stubForm = (nodes: unknown[]) =>
  stubGraph(client, {
    metadata: metadataResponse(['OptiFormsContainerData'], NO_FORMS_PROBE),
    content: resolvedForm('form-1', nodes),
  });

const isMetadataCall = (call: unknown[]) => String(call[0]).includes('GetContentMetadata');

const formFetches = (request: GraphRequestSpy) =>
  request.mock.calls.filter(call => call[1]?.key === 'form-1' && !isMetadataCall(call));

beforeEach(() => {
  initContentTypeRegistry([PageType, ...FormContentTypes]);
  refreshCache();
  client = new GraphClient('test-key');
});

describe('a form reached through a content area', () => {
  test('has its steps filled in', async () => {
    stubPage([nestedForm()]);

    const page: any = await client.getContent({ key: 'page-1' });

    expect(page.extras[0].nodes).toEqual(STEPS);
  });

  test('is fetched on its own, since the page query cannot carry them', async () => {
    const request = stubPage([nestedForm()]);

    await client.getContent({ key: 'page-1' });

    expect(formFetches(request).length).toBeGreaterThan(0);
  });

  test('costs nothing when the page holds no form', async () => {
    const request = stubPage([]);

    await client.getContent({ key: 'page-1' });

    // Metadata plus content, and nothing else.
    expect(request.mock.calls).toHaveLength(2);
  });
});

describe('the same shared form referenced twice', () => {
  // One shared form placed in two content areas arrives as two objects with
  // the same key. Fetching per object would double the round trips.
  test('is fetched once, not once per reference', async () => {
    const request = stubPage([nestedForm(), nestedForm()]);

    await client.getContent({ key: 'page-1' });

    expect(formFetches(request)).toHaveLength(1);
  });

  test('still fills in every reference', async () => {
    stubPage([nestedForm(), nestedForm()]);

    const page: any = await client.getContent({ key: 'page-1' });

    expect(page.extras[0].nodes).toEqual(STEPS);
    expect(page.extras[1].nodes).toEqual(STEPS);
  });
});

describe('the cost of filling forms in', () => {
  // Filling a form used to go through `getContent`, which spent a metadata
  // round trip rediscovering a type we already know is the forms container.
  test('spends one metadata request no matter how many forms there are', async () => {
    const request = stubPage(['form-0', 'form-1', 'form-2'].map(nestedForm));

    const page: any = await client.getContent({ key: 'page-1' });

    expect(request.mock.calls.filter(isMetadataCall)).toHaveLength(1);
    // One page query, three form fetches, one metadata.
    expect(request.mock.calls).toHaveLength(5);
    expect(page.extras.every((extra: any) => extra.nodes?.length === 1)).toBe(true);
  });
});

describe('a form whose steps already arrived', () => {
  // A container queried on its own, or one inside an experience composition,
  // is complete already. Re-fetching it would double every form's cost.
  test('is not fetched again', async () => {
    const request = stubForm(STEPS);

    const form: any = await client.getContent({ key: 'form-1' });

    expect(form.nodes).toEqual(STEPS);
    expect(request.mock.calls).toHaveLength(2);
  });

  // `nodes: []` means Graph answered; the form simply has no steps. Treating
  // that as unresolved would re-fetch it on every render and still get nothing.
  test('an empty form is not mistaken for an unresolved one', async () => {
    const request = stubForm([]);

    const form: any = await client.getContent({ key: 'form-1' });

    expect(form.nodes).toEqual([]);
    expect(request.mock.calls).toHaveLength(2);
  });
});
