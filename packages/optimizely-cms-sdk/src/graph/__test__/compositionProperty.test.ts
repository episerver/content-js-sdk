import { describe, expect, test, beforeEach } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createQueryContext, refreshCache } from '../../util/queryUtils.js';

/**
 * An experience can declare composition properties of its own, next to the
 * built-in `composition` it gets for free. They hold a node tree, so they select
 * `ICompositionNode` rather than a union of content types.
 */

const Element = contentType({
  key: 'PlainElement',
  displayName: 'Plain Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { heading: { type: 'string' } },
});

const OtherElement = contentType({
  key: 'OtherElement',
  displayName: 'Other Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { label: { type: 'string' } },
});

/** An experience holding both the built-in composition and a custom one. */
const Experience = contentType({
  key: 'HostExperience',
  displayName: 'Host Experience',
  baseType: '_experience',
  properties: {
    sidebar: { type: 'composition', format: 'grid' },
  },
});

const fragmentsFor = (key: string): string[] =>
  createFragment(key, new Set(), '', createQueryContext({ maxThreshold: 100 })).fragments;

const fragmentFor = (fragments: string[], key: string) =>
  fragments.find(f => f.startsWith(`fragment ${key} on`)) ?? '';

const countOf = (fragments: string[], key: string) =>
  fragments.filter(f => f.startsWith(`fragment ${key} on`)).length;

beforeEach(() => {
  initContentTypeRegistry([Experience, Element, OtherElement]);
  refreshCache();
});

describe('a composition property', () => {
  test('selects composition nodes, not a content union', () => {
    const experience = fragmentFor(fragmentsFor('HostExperience'), 'HostExperience');

    expect(experience).toContain('HostExperience__sidebar:sidebar { ...ICompositionNode }');
    expect(experience).not.toContain('HostExperience__sidebar:sidebar { __typename');
  });

  test('brings the composition element fragments with it', () => {
    const fragments = fragmentsFor('HostExperience');

    expect(fragmentFor(fragments, 'ICompositionNode')).toContain('..._IComponent');
    expect(fragmentFor(fragments, '_IComponent')).toContain('...PlainElement');
    expect(fragmentFor(fragments, '_IComponent')).toContain('...OtherElement');
  });

  test('keeps every element type regardless of restrictions', () => {
    const Restricted = contentType({
      key: 'RestrictedExperience',
      displayName: 'Restricted Experience',
      baseType: '_experience',
      properties: {
        sidebar: {
          type: 'composition',
          format: 'grid',
          allowedTypes: ['PlainElement'],
          restrictedTypes: ['OtherElement'],
        },
      },
    });
    initContentTypeRegistry([Restricted, Element, OtherElement]);
    refreshCache();

    const components = fragmentFor(fragmentsFor('RestrictedExperience'), '_IComponent');

    expect(components).toContain('...PlainElement');
    expect(components).toContain('...OtherElement');
  });
});

describe('alongside the built-in composition', () => {
  test('an experience fetches both', () => {
    const experience = fragmentFor(fragmentsFor('HostExperience'), 'HostExperience');

    expect(experience).toContain('..._IExperience');
    expect(experience).toContain('HostExperience__sidebar:sidebar { ...ICompositionNode }');
  });

  test('the shared fragments are emitted once', () => {
    const fragments = fragmentsFor('HostExperience');

    expect(countOf(fragments, 'ICompositionNode')).toBe(1);
    expect(countOf(fragments, '_IComponent')).toBe(1);
    expect(countOf(fragments, '_IExperience')).toBe(1);
  });

  test('a section declaring its own composition fetches it once', () => {
    const Section = contentType({
      key: 'RestrictedSection',
      displayName: 'Restricted Section',
      baseType: '_component',
      compositionBehaviors: ['sectionEnabled'],
      properties: {
        composition: { type: 'composition', format: 'grid' },
      },
    });
    initContentTypeRegistry([Section, Element]);
    refreshCache();

    const section = fragmentFor(fragmentsFor('RestrictedSection'), 'RestrictedSection');

    expect(section).toContain('composition { ...ICompositionNode }');
    expect(section).not.toContain('RestrictedSection__composition');
  });
});

/**
 * A `sectionEnabled` component may declare the reserved key `composition` to
 * type the canvas it inherits. That property must never be aliased: the alias
 * selects `ICompositionNode`, which spreads `_IComponent`, which spreads the
 * component's own fragment — a named-fragment cycle, which GraphQL rejects.
 *
 * Ownership is therefore decided by whether the type *has* a built-in
 * composition, not by whether this query fetches it.
 */
describe('an inherited composition property', () => {
  const Element = contentType({
    key: 'CycleElement',
    displayName: 'Cycle Element',
    baseType: '_component',
    compositionBehaviors: ['elementEnabled'],
    properties: { heading: { type: 'string' } },
  });

  const Section = contentType({
    key: 'CycleSection',
    displayName: 'Cycle Section',
    baseType: '_component',
    compositionBehaviors: ['sectionEnabled'],
    properties: { composition: { type: 'composition', format: 'grid' } },
  });

  const Experience = contentType({
    key: 'CycleExperience',
    displayName: 'Cycle Experience',
    baseType: '_experience',
    properties: {},
  });

  beforeEach(() => {
    initContentTypeRegistry([Element, Section, Experience]);
    refreshCache();
  });

  test('is not aliased when the section is reached inside a composition', () => {
    const fragments = fragmentsFor('CycleExperience');
    const section = fragmentFor(fragments, 'CycleSection');

    // `_IComponent` spreads the section, so the section must not spread back
    expect(fragmentFor(fragments, '_IComponent')).toContain('...CycleSection');
    expect(section).not.toContain('ICompositionNode');
    expect(section).not.toContain('CycleSection__composition');
  });

  test('is still read directly when the section is queried on its own', () => {
    const section = fragmentFor(fragmentsFor('CycleSection'), 'CycleSection');

    expect(section).toContain('composition { ...ICompositionNode }');
    expect(section).not.toContain('CycleSection__composition');
  });
});
