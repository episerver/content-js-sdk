import { beforeEach, describe, expect, test } from 'vitest';
import { GraphClient } from '../index.js';
import { GraphResponseError } from '../error.js';
import { clearTaxonomyCache } from '../operations.js';
import { contentType, contract, initContentTypeRegistry } from '../../model/index.js';
import { FormContentTypes } from '../../model/formContentTypes.js';
import { refreshCache } from '../../util/queryUtils.js';
import { configureAdapter } from '../../context/config.js';
import { MemoryAdapter } from '../../core/context/memoryAdapter.js';
import { type GraphRequestSpy, metadataResponse, stubGraph } from './helpers.js';

const Article = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: { title: { type: 'string' } },
});

const Standard = contentType({
  key: 'Standard',
  displayName: 'Standard',
  baseType: '_page',
  properties: {
    extras: { type: 'array', items: { type: 'content', allowedTypes: ['_component'] } },
  },
});

const TAXONOMY_SCHEMA = { taxonomyType: { fields: [{ name: 'categories' }] } };

const STEPS = [{ __typename: 'CompositionStructureNode', nodeType: 'step', key: 'step-1' }];

const previewParams = {
  preview_token: 'token',
  key: 'page-1',
  ctx: 'edit',
  ver: '4',
  loc: 'sv',
};

const termsResponse = { _TaxonomyTerm: { items: [{ _metadata: { key: 'term-a', displayName: 'A' } }] } };

const callsTo = (spy: GraphRequestSpy, operation: string) =>
  spy.mock.calls.filter(call => String(call[0]).includes(`query ${operation}`));

let client: GraphClient;

beforeEach(() => {
  initContentTypeRegistry([Article, Standard, ...FormContentTypes]);
  refreshCache();
  clearTaxonomyCache();
  configureAdapter(new MemoryAdapter());
  client = new GraphClient('test-key');
});

describe('getContentByPath', () => {
  test('returns every item at the path with type prefixes removed', async () => {
    stubGraph(client, {
      metadata: metadataResponse(['Article']),
      content: {
        _Content: {
          items: [
            { __typename: 'Article', Article__title: 'Original' },
            { __typename: 'Article', Article__title: 'Variation' },
          ],
        },
      },
    });

    const items = await client.getContentByPath('/news/');

    expect(items).toEqual([
      { __typename: 'Article', title: 'Original' },
      { __typename: 'Article', title: 'Variation' },
    ]);
  });

  test('returns an empty list when nothing lives at the path', async () => {
    const spy = stubGraph(client, { metadata: { _Content: { item: null }, damAssetType: null } });

    await expect(client.getContentByPath('/missing/')).resolves.toEqual([]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('returns an empty list when the content type is not registered', async () => {
    stubGraph(client, {
      metadata: metadataResponse(['Unregistered']),
      content: { _Content: { items: [{ __typename: 'Unregistered' }] } },
    });

    await expect(client.getContentByPath('/unknown/')).resolves.toEqual([]);
  });

  test('returns an empty list when the content query comes back without _Content', async () => {
    stubGraph(client, { metadata: metadataResponse(['Article']), content: { _Content: null } });

    await expect(client.getContentByPath('/news/')).resolves.toEqual([]);
  });

  test('fills in the steps of a form reached through a content area', async () => {
    stubGraph(client, {
      metadata: metadataResponse(['Standard'], { formsOnPage: { total: 0 } }),
      operations: {
        GetContent: {
          _Content: {
            item: {
              __typename: 'OptiFormsContainerData',
              _metadata: { key: 'form-1' },
              composition: { nodeType: 'section', key: 'form-1', nodes: STEPS },
            },
          },
        },
      },
      content: {
        _Content: {
          items: [
            {
              __typename: 'Standard',
              Standard__extras: [
                {
                  __typename: 'OptiFormsContainerData',
                  _metadata: { key: 'form-1', types: ['OptiFormsContainerData'] },
                  composition: { nodes: [] },
                },
              ],
            },
          ],
        },
      },
    });

    const [page]: any[] = await client.getContentByPath('/contact/');

    expect(page.extras[0].nodes).toEqual(STEPS);
  });

  test("resolves taxonomy in each item's own locale and shortens category keys", async () => {
    const spy = stubGraph(client, {
      metadata: metadataResponse(['Article'], TAXONOMY_SCHEMA),
      operations: { ResolveTaxonomyTerms: termsResponse },
      content: {
        _Content: {
          items: [
            {
              __typename: 'Article',
              _metadata: { locale: 'sv', categories: ['https://example.com/taxonomy/term-a'] },
            },
          ],
        },
      },
    });

    const [item]: any[] = await client.getContentByPath('/news/', { resolveTaxonomy: true });

    expect(callsTo(spy, 'ResolveTaxonomyTerms')[0][1]).toEqual({ keys: ['term-a'], locale: 'sv' });
    expect(item._metadata.categories).toEqual(['term-a']);
    expect(item._metadata.resolvedCategories).toMatchObject([{ key: 'term-a', displayName: 'A' }]);
  });
});

describe('getPreviewContent', () => {
  test('returns the draft decorated with the preview context at every level', async () => {
    stubGraph(client, {
      metadata: metadataResponse(['Article']),
      content: { _Content: { item: { __typename: 'Article', Article__title: 'Draft' } } },
    });

    const content = await client.getPreviewContent(previewParams);

    expect(content).toEqual({
      __typename: 'Article',
      title: 'Draft',
      __context: { edit: true, preview_token: 'token' },
    });
  });

  test('marks the context when media URLs should carry the token', async () => {
    stubGraph(client, {
      metadata: metadataResponse(['Article']),
      content: { _Content: { item: { __typename: 'Article', Article__title: 'Draft' } } },
    });

    const content: any = await client.getPreviewContent(previewParams, { forceMediaToken: true });

    expect(content.__context).toEqual({ edit: true, preview_token: 'token', media_token: 'token' });
  });

  test('throws a GraphResponseError naming the key when the content is not found', async () => {
    stubGraph(client, { metadata: { _Content: { item: null }, damAssetType: null } });

    const error = await client.getPreviewContent(previewParams).catch(caught => caught);

    expect(error).toBeInstanceOf(GraphResponseError);
    expect(error.message).toBe(
      "Content with key 'page-1' could not be found. Verify it exists in the CMS.",
    );
    expect(error.request.variables).toMatchObject({ key: 'page-1', version: '4' });
  });

  test('resolves taxonomy in the preview locale', async () => {
    const spy = stubGraph(client, {
      metadata: metadataResponse(['Article'], TAXONOMY_SCHEMA),
      operations: { ResolveTaxonomyTerms: termsResponse },
      content: {
        _Content: { item: { __typename: 'Article', _metadata: { categories: ['term-a'] } } },
      },
    });

    const content = await client.getPreviewContent(previewParams, { resolveTaxonomy: true });

    expect(callsTo(spy, 'ResolveTaxonomyTerms')[0][1]).toEqual({ keys: ['term-a'], locale: 'sv' });
    expect(content._metadata.resolvedCategories).toMatchObject([{ key: 'term-a', displayName: 'A' }]);
  });
});

describe('getContent', () => {
  test('returns null when the content type is not registered', async () => {
    stubGraph(client, {
      metadata: metadataResponse(['Unregistered']),
      content: { _Content: { item: { __typename: 'Unregistered' } } },
    });

    await expect(client.getContent({ key: 'a' })).resolves.toBeNull();
  });

  test('throws a GraphResponseError when Graph reports a type that is not a string', async () => {
    stubGraph(client, { metadata: metadataResponse([42 as unknown as string]) });

    const error = await client.getContent({ key: 'a' }).catch(caught => caught);

    expect(error).toBeInstanceOf(GraphResponseError);
    expect(error.message).toContain("Returned type is not 'string'");
    expect(error.request.variables).toMatchObject({ key: 'a' });
  });
});

describe('getPath', () => {
  const linksResponse = (path: string[] | undefined, keys: string[]) => ({
    _Content: {
      item: {
        _id: 'page',
        _metadata: { path },
        _link: { _Page: { items: keys.map(key => ({ _metadata: { key, displayName: key } })) } },
      },
    },
  });

  const stubLinks = (response: object) =>
    stubGraph(client, { metadata: {}, operations: { GetPath: response } });

  test('orders the ancestors by path and drops keys with no matching page', async () => {
    stubLinks(linksResponse(['root', 'gone', 'blog', 'post'], ['post', 'root', 'blog']));

    const ancestors = await client.getPath('/blog/post/');

    expect(ancestors?.map(link => link._metadata?.key)).toEqual(['root', 'blog', 'post']);
  });

  test('throws a GraphResponseError when the item has no path', async () => {
    stubLinks(linksResponse(undefined, ['block']));

    const error = await client.getPath({ key: 'block' }).catch(caught => caught);

    expect(error).toBeInstanceOf(GraphResponseError);
    expect(error.message).toContain('does not contain any `path` field');
  });

  test('explicit locales override the locale in the reference', async () => {
    const spy = stubLinks(linksResponse(['root'], ['root']));

    await client.getPath({ key: 'root', locale: 'en' }, { locales: ['sv-SE'] });

    expect(callsTo(spy, 'GetPath')[0][1]).toEqual({ key: 'root', locale: ['sv_SE'] });
  });
});

describe('getItems', () => {
  test('explicit locales override the locale in a graph:// reference', async () => {
    const spy = stubGraph(client, {
      metadata: {},
      operations: {
        GetItems: { _Content: { item: { _id: 'page', _metadata: {}, _link: { _Page: { items: [] } } } } },
      },
    });

    await expect(client.getItems('graph://cms/Page/root?loc=en', { locales: ['sv'] })).resolves.toEqual([]);
    expect(callsTo(spy, 'GetItems')[0][1]).toEqual({ key: 'root', locale: ['sv'] });
  });
});

describe('unset property normalization', () => {
  /** A `ContentUrl` with nothing filled in, which is how Graph answers an empty one. */
  const hollowUrl = {
    type: null,
    default: null,
    hierarchical: null,
    internal: null,
    graph: null,
    base: null,
  };

  const Linked = contentType({
    key: 'Linked',
    displayName: 'Linked',
    baseType: '_page',
    // A reference target declaring a `url` of its own, which must not be read
    // onto the `{ key, url, item }` wrapper pointing at it.
    properties: { url: { type: 'url' } },
  });

  const Promo = contentType({
    key: 'graph:Promo',
    displayName: 'Promo',
    baseType: '_component',
    properties: { link: { type: 'url' } },
  });

  const Card = contract({
    key: 'Card',
    displayName: 'Card',
    properties: { thumbnail: { type: 'contentReference', allowedTypes: ['_image'] } },
  });

  const Landing = contentType({
    key: 'Landing',
    displayName: 'Landing',
    baseType: '_page',
    properties: {
      image: { type: 'contentReference', allowedTypes: ['_image'] },
      target: { type: 'contentReference', contentType: Linked },
      cta: { type: 'url' },
      gallery: { type: 'array', items: { type: 'contentReference', allowedTypes: ['_image'] } },
      settings: { type: 'json' },
      promo: { type: 'component', contentType: Promo },
      cards: { type: 'array', items: { type: 'content', allowedTypes: [Card] } },
    },
  });

  /** `Card`'s implementations are deliberately left unregistered. */
  beforeEach(() => {
    initContentTypeRegistry([Landing, Linked, Promo, Card, ...FormContentTypes]);
    refreshCache();
  });

  const fetchLanding = async (item: Record<string, unknown>) => {
    stubGraph(client, {
      metadata: metadataResponse(['Landing']),
      content: {
        _Content: {
          item: { __typename: 'Landing', _metadata: { types: ['Landing'] }, ...item },
        },
      },
    });

    return client.getContent({ key: 'landing' });
  };

  test('nulls a reference, url or link that was never filled in', async () => {
    const content = await fetchLanding({
      image: { key: null, url: { ...hollowUrl }, item: { __typename: 'Data' } },
      cta: { ...hollowUrl },
    });

    expect(content.image).toBeNull();
    expect(content.cta).toBeNull();
  });

  test('keeps the url of a reference that points somewhere', async () => {
    const item = { __typename: 'Linked' };
    const content = await fetchLanding({
      target: { key: 'linked-1', url: { ...hollowUrl }, item },
    });

    // The target has no URL of its own, but the wrapper's `url` is not the
    // target's `url` property and stays an object either way.
    expect(content.target).toEqual({ key: 'linked-1', url: hollowUrl, item });
  });

  test('drops hollow entries from an array of references', async () => {
    const filled = { key: 'image-1', url: { ...hollowUrl, default: '/a.png' } };
    const content = await fetchLanding({
      gallery: [{ key: null, url: { ...hollowUrl } }, filled],
    });

    expect(content.gallery).toEqual([filled]);
  });

  test('leaves an authored json payload alone', async () => {
    const settings = { options: {}, title: null, nested: { url: null } };

    await expect(fetchLanding({ settings })).resolves.toMatchObject({ settings });
  });

  test('normalizes an embedded component through its declared type', async () => {
    const content = await fetchLanding({ promo: { link: { ...hollowUrl } } });

    expect(content.promo).toEqual({ link: null });
  });

  test('normalizes a contract property when the concrete type is unregistered', async () => {
    const content = await fetchLanding({
      cards: [
        {
          __typename: 'UnregisteredCard',
          _metadata: { key: 'card-1', types: ['UnregisteredCard', 'Card', '_Component'] },
          Card__thumbnail: { key: null, url: { ...hollowUrl }, item: { __typename: 'Data' } },
        },
      ],
    });

    expect(content.cards[0].thumbnail).toBeNull();
  });

  test('leaves content whose type is not registered at all untouched', async () => {
    const stranger = { __typename: 'Stranger', _metadata: { types: ['Stranger'] }, link: { ...hollowUrl } };
    const content = await fetchLanding({ cards: [stranger] });

    expect(content.cards[0]).toEqual(stranger);
  });
});
