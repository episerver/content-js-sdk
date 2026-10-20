import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { ExperienceNode } from '../../infer.js';
import { init as initDisplayTemplates } from '../../model/displayTemplateRegistry.js';
import { ComponentRegistry } from '../../render/componentRegistry.js';
import { initComponentRegistry, resetComponentRegistry } from '../render/registry.js';
import {
  getStructureContainer,
  isWrappedComponent,
  planComposition,
  planGridSection,
  type ComponentRenderItem,
  type StructureRenderItem,
} from '../render/plan.js';

const EDIT_CONTEXT = { edit: true, preview_token: 'token' };

const componentNode = (overrides: Partial<ExperienceNode> = {}): ExperienceNode =>
  ({
    __typename: 'CompositionComponentNode',
    type: 'Hero',
    key: 'hero-key',
    nodeType: 'component',
    layoutType: null,
    displayName: 'Hero',
    displayTemplateKey: null,
    displaySettings: null,
    component: { __typename: 'Hero', heading: 'Hello' },
    ...overrides,
  }) as ExperienceNode;

const structureNode = (overrides: Partial<ExperienceNode> = {}): ExperienceNode =>
  ({
    __typename: 'CompositionStructureNode',
    type: null,
    key: 'row-key',
    nodeType: 'row',
    layoutType: null,
    displayName: 'Row',
    displayTemplateKey: null,
    displaySettings: null,
    nodes: [],
    ...overrides,
  }) as ExperienceNode;

beforeEach(() => {
  initDisplayTemplates([
    {
      __type: 'displayTemplate',
      key: 'heroTemplate',
      displayName: 'Hero template',
      isDefault: false,
      tag: 'featured',
      baseType: '_component',
    },
  ]);
});

afterEach(() => {
  initDisplayTemplates([]);
  resetComponentRegistry();
});

describe('planComposition', () => {
  test('a component node offers the component data, with the resolved tag', () => {
    const [item] = planComposition(
      [componentNode({ displayTemplateKey: 'heroTemplate' })],
    ) as ComponentRenderItem[];

    expect(item).toMatchObject({
      kind: 'component',
      source: 'component',
      key: 'hero-key',
      tag: 'featured',
      content: { __typename: 'Hero', heading: 'Hello', __tag: 'featured' },
    });
  });

  test("a section node's own fields reach the content, under its type name", () => {
    const section = structureNode({
      type: 'ArticleSection',
      nodeType: 'section',
      key: 'section-key',
      component: { intro: 'Some intro' },
    });

    const [item] = planComposition([section]) as ComponentRenderItem[];

    expect(item.source).toBe('section');
    expect(item.content).toMatchObject({
      intro: 'Some intro',
      __typename: 'ArticleSection',
      key: 'section-key',
      nodeType: 'section',
      __tag: undefined,
    });
  });

  test('a node the CMS could not type is planned as unknown', () => {
    const [item] = planComposition([structureNode({ type: null })]);

    expect(item.kind).toBe('unknown');
    expect(item).not.toHaveProperty('content');
  });

  test('display settings are parsed, and booleans come through as booleans', () => {
    const [item] = planComposition([
      componentNode({
        displaySettings: [
          { key: 'width', value: 'wide' },
          { key: 'boxed', value: 'true' },
        ],
      }),
    ]);

    expect(item.displaySettings).toEqual({ width: 'wide', boxed: true });
  });

  test('preview attributes appear only in edit mode', () => {
    const [plain] = planComposition([componentNode()]);
    expect(plain.previewAttrs).toEqual({});

    const [editing] = planComposition([componentNode({ __context: EDIT_CONTEXT })]);
    expect(editing.previewAttrs).toEqual({ 'data-epi-block-id': 'hero-key' });
  });

  test('only component nodes are reported as wrapped', () => {
    const items = planComposition([
      componentNode(),
      structureNode({ type: 'ArticleSection', nodeType: 'section' }),
      structureNode({ type: null }),
    ]);

    expect(items.map(isWrappedComponent)).toEqual([true, false, false]);
  });
});

describe('planGridSection', () => {
  test('a component node keeps a reference to the node it came from', () => {
    const node = componentNode({ displayTemplateKey: 'heroTemplate' });
    const [item] = planGridSection([node]) as ComponentRenderItem[];

    expect(item.source).toBe('component');
    expect(item.content).toEqual({
      __typename: 'Hero',
      heading: 'Hello',
      __composition: node,
      __tag: 'featured',
    });
    // Unlike a composition, the node's own scalar fields stay out of the content.
    expect(item.content).not.toHaveProperty('displayName');
  });

  test('rows and columns nest, and the leaf component is reached', () => {
    const leaf = componentNode({ key: 'leaf' });
    const grid = structureNode({
      key: 'row',
      nodeType: 'row',
      nodes: [structureNode({ key: 'column', nodeType: 'column', nodes: [leaf] })],
    });

    const [row] = planGridSection([grid]) as StructureRenderItem<string>[];
    const [column] = row.children as StructureRenderItem<string>[];

    expect(row).toMatchObject({ kind: 'structure', nodeType: 'row', index: 0 });
    expect(column).toMatchObject({ kind: 'structure', nodeType: 'column', index: 0 });
    expect(column.children[0]).toMatchObject({ kind: 'component', key: 'leaf' });
  });

  test('rows and columns pick up the globally registered components', () => {
    initComponentRegistry({ resolver: { _Row: 'RowComponent', _Column: 'ColumnComponent' } });

    const grid = structureNode({
      nodeType: 'row',
      nodes: [structureNode({ key: 'column', nodeType: 'column' })],
    });

    const [row] = planGridSection<string>([grid]) as StructureRenderItem<string>[];

    expect(row.globalComponent).toBe('RowComponent');
    expect((row.children[0] as StructureRenderItem<string>).globalComponent).toBe(
      'ColumnComponent',
    );
  });

  test('a registry passed in supplies the row and column components at every depth', () => {
    initComponentRegistry({ resolver: { _Row: 'GlobalRow', _Column: 'GlobalColumn' } });

    const registry = new ComponentRegistry<string>({ _Row: 'LocalRow' });
    const grid = structureNode({
      nodeType: 'row',
      nodes: [structureNode({ key: 'column', nodeType: 'column' })],
    });

    const [row] = planGridSection<string>([grid], { registry }) as StructureRenderItem<string>[];

    expect(row.globalComponent).toBe('LocalRow');
    expect((row.children[0] as StructureRenderItem<string>).globalComponent).toBeUndefined();
  });

  test('a structure node that is neither row nor column has no global component', () => {
    initComponentRegistry({ resolver: { _Row: 'RowComponent' } });

    const [item] = planGridSection<string>([
      structureNode({ nodeType: 'step' }),
    ]) as StructureRenderItem<string>[];

    expect(item.globalComponent).toBeUndefined();
    expect(item.children).toEqual([]);
  });

  test('the index is the position among its siblings, not a running count', () => {
    const items = planGridSection([
      structureNode({ key: 'a', nodes: [structureNode({ key: 'a1' })] }),
      structureNode({ key: 'b' }),
    ]) as StructureRenderItem<string>[];

    expect(items.map(it => it.index)).toEqual([0, 1]);
    expect((items[0].children[0] as StructureRenderItem<string>).index).toBe(0);
  });
});

describe('getStructureContainer', () => {
  const planRow = () => planGridSection<string>([structureNode()])[0] as StructureRenderItem<string>;

  test('an override wins over the registered component and the fallback', () => {
    initComponentRegistry({ resolver: { _Row: 'GlobalRow' } });

    expect(
      getStructureContainer(planRow(), { overrides: { row: 'OwnRow' }, fallbacks: { row: 'FallbackRow' } }),
    ).toBe('OwnRow');
  });

  test('the registered component wins over the fallback', () => {
    initComponentRegistry({ resolver: { _Row: 'GlobalRow' } });

    expect(getStructureContainer(planRow(), { fallbacks: { row: 'FallbackRow' } })).toBe('GlobalRow');
  });

  test('an override skips the registry lookup', () => {
    const lookups: string[] = [];
    initComponentRegistry({ resolver: (contentType: string) => (lookups.push(contentType), 'GlobalRow') });

    getStructureContainer(planRow(), { overrides: { row: 'OwnRow' } });

    expect(lookups).toEqual([]);
  });

  test('the fallback is used when nothing else is given, and nothing when it is absent', () => {
    expect(getStructureContainer(planRow(), { fallbacks: { row: 'FallbackRow' } })).toBe('FallbackRow');
    expect(getStructureContainer(planRow())).toBeUndefined();
  });
});
