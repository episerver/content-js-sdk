import { describe, expect, test, beforeEach, vi } from 'vitest';
import { createFragment } from '../createQuery.js';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createQueryContext, refreshCache } from '../../util/queryUtils.js';
import { configureAdapter } from '../../context/config.js';
import { ReactContextAdapter } from '../../context/reactContextAdapter.js';

/**
 * A section owns a composition, and Graph exposes it as a `composition` field on
 * every `_Section`. Nested in an experience its children arrive through that
 * experience's composition tree, but requested on its own — previewing a shared
 * block from the CMS — nothing fetched them, so the component rendered its own
 * fields and nothing inside it.
 */

const Element = contentType({
  key: 'PlainElement',
  displayName: 'Plain Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { heading: { type: 'string' } },
});

const Section = contentType({
  key: 'PlainSection',
  displayName: 'Plain Section',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: { title: { type: 'string' } },
});

const Experience = contentType({
  key: 'HostExperience',
  displayName: 'Host Experience',
  baseType: '_experience',
  properties: {},
});

const fragmentsFor = (key: string): string[] =>
  createFragment(key, new Set(), '', createQueryContext({ maxFragmentThreshold: 100 }))
    .fragments;

const sectionFragment = (fragments: string[]) =>
  fragments.find(f => f.startsWith('fragment PlainSection on')) ?? '';

beforeEach(() => {
  initContentTypeRegistry([Experience, Section, Element]);
  refreshCache();
});

describe('a section requested on its own', () => {
  test('fetches its composition', () => {
    const fragments = fragmentsFor('PlainSection');

    expect(sectionFragment(fragments)).toContain('composition { ...ICompositionNode }');
    expect(fragments.some(f => f.startsWith('fragment ICompositionNode'))).toBe(true);
    // The elements inside it have to be spread somewhere, or the nodes come back bare.
    expect(fragments.some(f => f.startsWith('fragment _IComponent'))).toBe(true);
  });

  // GraphQL rejects a document that declares a fragment nothing spreads, and a
  // section reads `composition` directly rather than through `_IExperience`.
  test('does not declare the unused _IExperience fragment', () => {
    const fragments = fragmentsFor('PlainSection');

    expect(fragments.some(f => f.startsWith('fragment _IExperience'))).toBe(false);
  });
});

describe('a section reached through an experience', () => {
  test('does not fetch its own composition', () => {
    const fragments = fragmentsFor('HostExperience');

    // Present as a spread inside _IComponent, but without a composition of its own:
    // those children already arrive through the experience's composition tree.
    expect(sectionFragment(fragments)).not.toContain('composition');
  });

  test('still declares _IExperience, which the experience spreads', () => {
    const fragments = fragmentsFor('HostExperience');

    expect(fragments.some(f => f.startsWith('fragment _IExperience'))).toBe(true);
  });
});

describe('previewing a section as a shared block', () => {
  const previewParams = {
    key: 'block-1',
    ver: '1',
    loc: 'en',
    ctx: 'edit',
    preview_token: 'token',
  };

  /** A section response shaped the way Graph returns one. */
  const sectionResponse = {
    _Content: {
      item: {
        __typename: 'PlainSection',
        _metadata: { types: ['PlainSection'] },
        PlainSection__title: 'Get in touch',
        composition: {
          __typename: 'CompositionStructureNode',
          nodeType: 'section',
          key: 'block-1',
          nodes: [
            {
              __typename: 'CompositionStructureNode',
              nodeType: 'step',
              key: 'step-1',
              nodes: [
                {
                  __typename: 'CompositionStructureNode',
                  nodeType: 'row',
                  key: 'row-1',
                  nodes: [
                    {
                      __typename: 'CompositionStructureNode',
                      nodeType: 'column',
                      key: 'col-1',
                      nodes: [
                        {
                          __typename: 'CompositionComponentNode',
                          nodeType: 'component',
                          key: 'field-1',
                          component: {
                            __typename: 'PlainElement',
                            PlainElement__heading: 'Name',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  };

  const previewContent = async () => {
    // `getPreviewContent` records the current content in context as it resolves.
    configureAdapter(new ReactContextAdapter());
    const client = new GraphClient('test-key');
    vi.spyOn(client, 'request').mockImplementation(async (query: string) =>
      query.includes('GetContentMetadata') ?
        { _Content: { item: { _metadata: { types: ['PlainSection'] } } }, damAssetType: null }
      : sectionResponse,
    );

    return (await client.getPreviewContent(previewParams)) as any;
  };

  test('exposes the children as `nodes`, where a section renderer looks', async () => {
    const content = await previewContent();

    expect(content.nodes).toHaveLength(1);
    expect(content.title).toBe('Get in touch');
  });

  // The nodes are lifted out of `composition` before the preview context is
  // attached. If that ordering flipped, every child would render uneditable.
  // Rows and columns are what the editor highlights, and they sit several levels
  // below the section, so the decoration has to reach all the way down.
  test('marks every level of the composition as editable', async () => {
    const content = await previewContent();

    const step = content.nodes[0];
    const row = step.nodes[0];
    const column = row.nodes[0];
    const field = column.nodes[0];

    expect(content.__context.edit).toBe(true);
    expect(step.__context.edit).toBe(true);
    expect(row.__context.edit).toBe(true);
    expect(column.__context.edit).toBe(true);
    expect(field.__context.edit).toBe(true);
    expect(field.component.__context.edit).toBe(true);
  });
});
