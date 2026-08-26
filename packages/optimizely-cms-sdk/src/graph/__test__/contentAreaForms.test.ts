import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { FormContentTypes } from '../../model/formContentTypes.js';

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

/** A container as it arrives inside a content area: no steps. */
const nestedForm = () => ({
  __typename: 'OptiFormsContainerData',
  _metadata: { key: 'form-1', locale: 'en', types: ['OptiFormsContainerData'] },
  composition: { key: null, nodes: [] },
});

let client: GraphClient;
let request: any;

/** Stubs the page fetch, plus the direct fetch the client should make for the form. */
const stubGraph = ({ formTypes = ['OptiFormsContainerData'] } = {}) => {
  request = vi
    .spyOn(client, 'request')
    .mockImplementation(async (query: string, vars: any) => {
      const askedForTheForm = JSON.stringify(vars?.where ?? {}).includes('form-1');

      if (query.includes('GetContentMetadata')) {
        return {
          _Content: {
            item: { _metadata: { types: askedForTheForm ? formTypes : ['Standard'] } },
          },
          damAssetType: null,
          formsOnPage: { total: 0 },
        };
      }

      if (askedForTheForm) {
        return {
          _Content: {
            item: {
              __typename: 'OptiFormsContainerData',
              _metadata: { key: 'form-1' },
              // Asked for directly, Graph does resolve it.
              composition: { nodeType: 'section', key: 'form-1', nodes: STEPS },
            },
          },
        };
      }

      return {
        _Content: {
          item: { __typename: 'Standard', Standard__extras: [nestedForm()] },
        },
      };
    });
};

beforeEach(() => {
  initContentTypeRegistry([PageType, ...FormContentTypes]);
  refreshCache();
  client = new GraphClient('test-key');
  stubGraph();
});

describe('a form reached through a content area', () => {
  test('has its steps filled in', async () => {
    const page: any = await client.getContent({ key: 'page-1' });

    expect(page.extras[0].nodes).toEqual(STEPS);
  });

  test('is fetched on its own, since the page query cannot carry them', async () => {
    await client.getContent({ key: 'page-1' });

    const askedForTheForm = request.mock.calls.filter((c: any[]) =>
      JSON.stringify(c[1]?.where ?? {}).includes('form-1'),
    );
    expect(askedForTheForm.length).toBeGreaterThan(0);
  });

  test('costs nothing when the page holds no form', async () => {
    request.mockImplementation(async (query: string) =>
      query.includes('GetContentMetadata') ?
        {
          _Content: { item: { _metadata: { types: ['Standard'] } } },
          damAssetType: null,
          formsOnPage: { total: 0 },
        }
      : { _Content: { item: { __typename: 'Standard', Standard__extras: [] } } },
    );

    await client.getContent({ key: 'page-1' });

    // Metadata plus content, and nothing else.
    expect(request.mock.calls).toHaveLength(2);
  });
});

describe('a form dropped into a composition as a shared block', () => {
  // Created inline it is a section node and its steps come down with the page.
  // Inserted as an existing shared block Graph reports a component node, and
  // `nodes` is only selected inside `...on CompositionStructureNode`, so the
  // steps are absent from the response entirely.
  const ExperienceType = contentType({
    key: 'Product',
    displayName: 'Product',
    baseType: '_experience',
    properties: {},
  });

  beforeEach(() => {
    initContentTypeRegistry([ExperienceType, ...FormContentTypes]);
    refreshCache();

    request = vi
      .spyOn(client, 'request')
      .mockImplementation(async (query: string, vars: any) => {
        const askedForTheForm = JSON.stringify(vars?.where ?? {}).includes('form-1');

        if (query.includes('GetContentMetadata')) {
          return {
            _Content: {
              item: {
                _metadata: {
                  types: askedForTheForm ? ['OptiFormsContainerData'] : ['Product'],
                },
              },
            },
            damAssetType: null,
            formsOnPage: { total: 1 },
          };
        }

        if (askedForTheForm) {
          return {
            _Content: {
              item: {
                __typename: 'OptiFormsContainerData',
                _metadata: { key: 'form-1' },
                composition: { nodeType: 'section', key: 'form-1', nodes: STEPS },
              },
            },
          };
        }

        return {
          _Content: {
            item: {
              __typename: 'Product',
              composition: {
                nodeType: 'experience',
                nodes: [
                  {
                    __typename: 'CompositionComponentNode',
                    nodeType: 'component',
                    type: 'OptiFormsContainerData',
                    key: 'node-1',
                    component: {
                      __typename: 'OptiFormsContainerData',
                      _metadata: { key: 'form-1', locale: 'en' },
                    },
                  },
                ],
              },
            },
          },
        };
      });
  });

  test('has its steps filled in', async () => {
    const page: any = await client.getContent({ key: 'page-1' });

    expect(page.composition.nodes[0].component.nodes).toEqual(STEPS);
  });
});
describe('the same shared form referenced twice', () => {
  // One shared form placed in two content areas arrives as two objects with
  // the same key. Fetching per object would double the round trips.
  const stubTwice = () =>
    vi.spyOn(client, 'request').mockImplementation(async (query: string, vars: any) => {
      const askedForTheForm = JSON.stringify(vars?.where ?? {}).includes('form-1');

      if (query.includes('GetContentMetadata')) {
        return {
          _Content: {
            item: {
              _metadata: {
                types: askedForTheForm ? ['OptiFormsContainerData'] : ['Standard'],
              },
            },
          },
          damAssetType: null,
          formsOnPage: { total: 0 },
        };
      }

      if (askedForTheForm) {
        return {
          _Content: {
            item: {
              __typename: 'OptiFormsContainerData',
              _metadata: { key: 'form-1' },
              composition: { nodeType: 'section', key: 'form-1', nodes: STEPS },
            },
          },
        };
      }

      return {
        _Content: {
          item: {
            __typename: 'Standard',
            Standard__extras: [nestedForm(), nestedForm()],
          },
        },
      };
    });

  test('is fetched once, not once per reference', async () => {
    request = stubTwice();

    await client.getContent({ key: 'page-1' });

    const formFetches = request.mock.calls.filter(
      (call: any[]) =>
        JSON.stringify(call[1]?.where ?? {}).includes('form-1') &&
        !String(call[0]).includes('GetContentMetadata'),
    );
    expect(formFetches).toHaveLength(1);
  });

  test('still fills in every reference', async () => {
    request = stubTwice();

    const page: any = await client.getContent({ key: 'page-1' });

    expect(page.extras[0].nodes).toEqual(STEPS);
    expect(page.extras[1].nodes).toEqual(STEPS);
  });
});
describe('a form whose steps already arrived', () => {
  // A container queried on its own, or one inside an experience composition,
  // is complete already. Re-fetching it would double every form's cost.
  test('is not fetched again', async () => {
    request = vi.spyOn(client, 'request').mockImplementation(async (query: string) =>
      query.includes('GetContentMetadata') ?
        {
          _Content: { item: { _metadata: { types: ['OptiFormsContainerData'] } } },
          damAssetType: null,
          formsOnPage: { total: 0 },
        }
      : {
          _Content: {
            item: {
              __typename: 'OptiFormsContainerData',
              _metadata: { key: 'form-1' },
              composition: { nodeType: 'section', key: 'form-1', nodes: STEPS },
            },
          },
        },
    );

    const form: any = await client.getContent({ key: 'form-1' });

    expect(form.nodes).toEqual(STEPS);
    expect(request.mock.calls).toHaveLength(2);
  });

  // `nodes: []` means Graph answered; the form simply has no steps. Treating
  // that as unresolved would re-fetch it on every render and still get nothing.
  test('an empty form is not mistaken for an unresolved one', async () => {
    request = vi.spyOn(client, 'request').mockImplementation(async (query: string) =>
      query.includes('GetContentMetadata') ?
        {
          _Content: { item: { _metadata: { types: ['OptiFormsContainerData'] } } },
          damAssetType: null,
          formsOnPage: { total: 0 },
        }
      : {
          _Content: {
            item: {
              __typename: 'OptiFormsContainerData',
              _metadata: { key: 'form-1' },
              composition: { nodeType: 'section', key: 'form-1', nodes: [] },
            },
          },
        },
    );

    const form: any = await client.getContent({ key: 'form-1' });

    expect(form.nodes).toEqual([]);
    expect(request.mock.calls).toHaveLength(2);
  });
});
