/**
 * Pins what PaaS sends to Graph and returns to renderers. The query builders are
 * shared with SaaS, so a snapshot diff here means a shared change reached PaaS:
 * update the snapshot if PaaS should get it, otherwise move it behind a SaaS hook.
 */
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { GraphClient, contentType, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { configureAdapter, MemoryAdapter } from '@optimizely/cms-sdk/core';
import { paas } from '../index.js';

const Teaser = contentType({
  key: 'Teaser',
  displayName: 'Teaser',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    heading: { type: 'string' },
    image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

const ArticlePage = contentType({
  key: 'ArticlePage',
  displayName: 'Article page',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
    body: { type: 'richText' },
    teasers: { type: 'array', items: { type: 'content', allowedTypes: [Teaser] } },
  },
});

const LandingPage = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_experience',
  properties: { title: { type: 'string' } },
});

const metadataResponse = (type: string, { dam = false, taxonomy = false } = {}) => ({
  _Content: { item: { _metadata: { types: [type] } } },
  damAssetType: dam ? { __typename: '__Type' } : null,
  taxonomyType: { fields: taxonomy ? [{ name: 'categories' }] : [] },
});

const article = {
  __typename: 'ArticlePage',
  _metadata: { key: 'article', types: ['ArticlePage', '_Page'] },
  ArticlePage__title: 'Hello',
  ArticlePage__body: { json: { type: 'richText', children: [] } },
  ArticlePage__teasers: [
    { __typename: 'Teaser', _metadata: { types: ['Teaser'] }, Teaser__heading: 'One' },
  ],
};

/** A PaaS client whose requests return `responses` in order, recording each query. */
function stubClient(...responses: unknown[]) {
  const client = new GraphClient('key', { platform: paas() });
  const request = vi.spyOn(client, 'request');
  responses.forEach(response => request.mockResolvedValueOnce(response));
  const queries = () => request.mock.calls.map(([query]) => query);
  return { client, queries };
}

beforeAll(() => {
  initContentTypeRegistry([Teaser, ArticlePage, LandingPage]);
  configureAdapter(new MemoryAdapter());
});

describe('PaaS contract', () => {
  test('getContent with DAM and taxonomy detected', async () => {
    const item = {
      ...article,
      ArticlePage__itemMetadata: { categories: ['graph://taxonomy/news'] },
    };
    const { client, queries } = stubClient(
      metadataResponse('ArticlePage', { dam: true, taxonomy: true }),
      { _Content: { item } },
    );

    const result = await client.getContent({ key: 'article', locale: 'en' });

    expect(queries()).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  test('getContentByPath', async () => {
    const { client, queries } = stubClient(metadataResponse('ArticlePage'), {
      _Content: { items: [article] },
    });

    const result = await client.getContentByPath('/news/hello/');

    expect(queries()).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  test('getPreviewContent of an experience', async () => {
    const item = {
      __typename: 'LandingPage',
      _metadata: { key: 'landing', types: ['LandingPage', '_Experience'] },
      LandingPage__title: 'Welcome',
      composition: {
        nodeType: 'experience',
        nodes: [
          {
            __typename: 'CompositionComponentNode',
            key: 'node-1',
            nodeType: 'component',
            component: {
              __typename: 'Teaser',
              _metadata: { types: ['Teaser'] },
              Teaser__heading: 'Hi',
            },
          },
        ],
      },
    };
    const { client, queries } = stubClient(metadataResponse('LandingPage'), {
      _Content: { item },
    });

    const result = await client.getPreviewContent({
      preview_token: 'token',
      key: 'landing',
      ctx: 'edit',
      ver: '3',
      loc: 'en',
    });

    expect(queries()).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });
});
